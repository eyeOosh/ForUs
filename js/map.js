import { supabase } from "./supabase-client.js";

const mapContainer = document.querySelector("#map");
const addPinPanel = document.querySelector("#add-pin-panel");
const closePinBtn = document.querySelector("#close-pin-btn");
const savePinForm = document.querySelector("#save-pin-form");

const latInput = document.querySelector("#pin-lat");
const lngInput = document.querySelector("#pin-lng");
const titleInput = document.querySelector("#pin-title");
const locationInput = document.querySelector("#pin-location");
const typeInput = document.querySelector("#pin-type");
const dateInput = document.querySelector("#pin-date");
const byInput = document.querySelector("#pin-by");
const imageInput = document.querySelector("#pin-image");
const noteInput = document.querySelector("#pin-note");
const formMessage = document.querySelector("#pin-form-message");

const searchForm = document.querySelector("#map-search-form");
const searchInput = document.querySelector("#map-search-input");
const searchMessage = document.querySelector("#map-search-message");

let map = null;
let currentMarkers = [];
let allPinsData = [];
let tempMarker = null;

// Auth Guard
if (!supabase) {
  mapContainer.innerHTML = `<div class="loading-card">Please configure js/config.js first.</div>`;
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      window.location.href = "index.html";
    } else if (!map) {
      initMap();
    }
  });
  checkSession();
}

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    window.location.href = "index.html";
  } else if (!map) {
    initMap();
  }
}

function initMap() {
  map = L.map("map", {
    minZoom: 3, // Prevents zooming out beyond a single world view
    maxBounds: [
      [-90, -180], // Southwest bounds
      [90, 180]    // Northeast bounds
    ],
    maxBoundsViscosity: 1.0 // Bounces the map back if pulled beyond edges
  }).setView([25.0, 10.0], 3);

  // Exact tile URL to use:
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Map Click Event -> Open Add Pin Form
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    latInput.value = lat;
    lngInput.value = lng;

    if (tempMarker) map.removeLayer(tempMarker);

    // Temporary marker while filling out form
    tempMarker = L.marker([lat, lng], {
      icon: createCustomIcon("📍")
    }).addTo(map);

    addPinPanel.classList.remove("hidden");
    addPinPanel.scrollIntoView({ behavior: "smooth" });
  });

  closePinBtn.addEventListener("click", () => {
    if (tempMarker) map.removeLayer(tempMarker);
    addPinPanel.classList.add("hidden");
  });

  setupFilters();
  loadPins();
}

function createCustomIcon(emoji) {
  return L.divIcon({
    className: "custom-heart-pin",
    html: `<div>${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

// Fetch Pins from Supabase
async function loadPins() {
  const { data, error } = await supabase
    .from("map_pins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pins:", error);
    return;
  }

  allPinsData = data;
  renderMarkers(allPinsData);
}

function renderMarkers(pins) {
  // Clear existing markers
  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];

  pins.forEach(pin => {
    const emoji = pin.pin_type === "visited" ? "💖" : "✈️";
    const icon = createCustomIcon(emoji);

    const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);

    const popupHtml = `
      <div class="popup-card">
        ${pin.image_url ? `<img src="${escapeAttr(pin.image_url)}" alt="">` : ""}
        <h4>${escapeHtml(pin.title)}</h4>
        <p><strong>${escapeHtml(pin.location_name || "")}</strong> ${pin.date_label ? `• ${escapeHtml(pin.date_label)}` : ""}</p>
        ${pin.note ? `<p style="margin-top:6px; color: var(--text);">${escapeHtml(pin.note)}</p>` : ""}
        <p style="margin-top:8px; font-size:0.72rem; text-align:right;">Added by ${escapeHtml(pin.created_by || "Us")}</p>
      </div>
    `;

    marker.bindPopup(popupHtml);
    currentMarkers.push(marker);
  });
}

// Save Pin Form Submit
savePinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "Dropping pin...";

  const payload = {
    title: titleInput.value.trim(),
    location_name: locationInput.value.trim() || null,
    lat: parseFloat(latInput.value),
    lng: parseFloat(lngInput.value),
    pin_type: typeInput.value,
    date_label: dateInput.value.trim() || null,
    created_by: byInput.value,
    image_url: imageInput.value.trim() || null,
    note: noteInput.value.trim() || null
  };

  const { error } = await supabase.from("map_pins").insert(payload);

  if (error) {
    formMessage.textContent = error.message;
    formMessage.className = "form-message error";
  } else {
    formMessage.textContent = "Pin added! ♡";
    formMessage.className = "form-message success";
    savePinForm.reset();
    if (tempMarker) map.removeLayer(tempMarker);
    addPinPanel.classList.add("hidden");
    loadPins();
  }
});

// Setup Pin Filters
function setupFilters() {
  document.querySelector("#filter-all").addEventListener("click", () => renderMarkers(allPinsData));
  document.querySelector("#filter-visited").addEventListener("click", () => {
    renderMarkers(allPinsData.filter(p => p.pin_type === "visited"));
  });
  document.querySelector("#filter-wishlist").addEventListener("click", () => {
    renderMarkers(allPinsData.filter(p => p.pin_type === "wishlist"));
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value = "") { return escapeHtml(value); }

if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    searchMessage.textContent = "Finding location…";
    searchMessage.className = "form-message";

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const results = await res.json();

      if (!results || results.length === 0) {
        searchMessage.textContent = "Location not found. Try a different place name.";
        searchMessage.className = "form-message error";
        return;
      }

      const topResult = results[0];
      const lat = parseFloat(topResult.lat);
      const lng = parseFloat(topResult.lon);

      // Smoothly animate map to the found coordinates
      map.flyTo([lat, lng], 13, { duration: 1.5 });

      // Pre-fill pin form values
      latInput.value = lat;
      lngInput.value = lng;
      
      const shortName = topResult.display_name.split(",")[0] || query;
      locationInput.value = shortName;
      titleInput.value = `${shortName}`;

      // Place or move the temporary pin marker
      if (tempMarker) map.removeLayer(tempMarker);
      tempMarker = L.marker([lat, lng], {
        icon: createCustomIcon("📍")
      }).addTo(map);

      // Reveal form
      addPinPanel.classList.remove("hidden");
      addPinPanel.scrollIntoView({ behavior: "smooth" });

      searchMessage.textContent = `Found: ${topResult.display_name}`;
      searchMessage.className = "form-message success";
    } catch (err) {
      console.error(err);
      searchMessage.textContent = "Could not reach location service. Try again in a moment.";
      searchMessage.className = "form-message error";
    }
  });
}