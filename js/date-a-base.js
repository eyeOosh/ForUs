import { supabase } from "./supabase-client.js";

const toggleAddBtn = document.querySelector("#toggle-add-btn");
const closeAddBtn = document.querySelector("#close-add-btn");
const addDatePanel = document.querySelector("#add-date-panel");
const datesGrid = document.querySelector("#dates-grid");

const rollDiceBtn = document.querySelector("#roll-dice-btn");
const surpriseCard = document.querySelector("#surprise-card");
const surpriseContent = document.querySelector("#surprise-content");
const closeSurpriseBtn = document.querySelector("#close-surprise-btn");

const saveForm = document.querySelector("#save-date-form");
const titleInput = document.querySelector("#date-title");
const whoseInput = document.querySelector("#whose-idea");
const timelineInput = document.querySelector("#date-timeline");
const whereInput = document.querySelector("#date-where");
const costInput = document.querySelector("#date-cost");
const completeInput = document.querySelector("#date-complete");
const notesInput = document.querySelector("#date-notes");
const formMessage = document.querySelector("#date-form-message");

let allDates = [];

// Auth Session Guard
if (!supabase) {
  datesGrid.innerHTML = `<div class="loading-card">Please configure js/config.js first.</div>`;
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      window.location.href = "index.html";
    } else {
      loadDates();
    }
  });
  checkSession();
}

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    window.location.href = "index.html";
  } else {
    loadDates();
  }
}

// Toggle Forms
toggleAddBtn.addEventListener("click", () => addDatePanel.classList.toggle("hidden"));
closeAddBtn.addEventListener("click", () => addDatePanel.classList.add("hidden"));
closeSurpriseBtn.addEventListener("click", () => surpriseCard.classList.add("hidden"));

// Save Date Idea
saveForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "Saving date idea...";

  const payload = {
    title: titleInput.value.trim(),
    whose_idea: whoseInput.value,
    timeline: timelineInput.value,
    where_location: whereInput.value,
    cost: costInput.value,
    complete: completeInput.value === "true",
    notes: notesInput.value.trim() || null
  };

  const { error } = await supabase.from("date_ideas").insert(payload);

  if (error) {
    formMessage.textContent = error.message;
    formMessage.className = "form-message error";
  } else {
    formMessage.textContent = "Date idea added! ♡";
    formMessage.className = "form-message success";
    saveForm.reset();
    addDatePanel.classList.add("hidden");
    loadDates();
  }
});

// Load Dates from Supabase sorted so 'complete = false' (No) is at top and 'complete = true' (Yes) is at bottom
async function loadDates() {
  const { data, error } = await supabase
    .from("date_ideas")
    .select("*")
    .order("complete", { ascending: true }) // false (No) first, true (Yes) at bottom
    .order("created_at", { ascending: false });

  if (error) {
    datesGrid.innerHTML = `<div class="loading-card">Error loading date ideas. Check SQL setup.</div>`;
    return;
  }

  allDates = data;
  renderDates();
}

function renderDates() {
  if (!allDates.length) {
    datesGrid.innerHTML = `<div class="loading-card">No date ideas yet! Click "+ Add Date Idea" to add one. ♡</div>`;
    return;
  }

  datesGrid.innerHTML = allDates.map(item => `
    <div class="month-card ${item.complete ? 'completed-card' : ''}">
      <div class="card-content">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <p class="card-month">Idea by ${escapeHtml(item.whose_idea)}</p>
          <span class="count-pill" style="font-size:0.7rem; background: ${item.complete ? '#d3f2e1' : '#f7e4e9'}; color: ${item.complete ? '#2e6b47' : '#a9415e'};">
            ${item.complete ? '✓ Completed' : '⏳ Pending'}
          </span>
        </div>

        <h3 class="card-title" style="margin-top:6px;">${escapeHtml(item.title)}</h3>

        <div class="date-card-tags">
          <span class="tag-badge timeline">⏱️ ${escapeHtml(item.timeline)}</span>
          <span class="tag-badge where">📍 ${escapeHtml(item.where_location)}</span>
          <span class="tag-badge cost">💰 ${escapeHtml(item.cost)}</span>
        </div>

        ${item.notes ? `<p class="card-date" style="margin-top: 10px;">"${escapeHtml(item.notes)}"</p>` : ""}

        <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line); padding-top: 12px;">
          <button class="text-button toggle-complete-btn" data-id="${item.id}" data-complete="${item.complete}">
            ${item.complete ? 'Mark Uncompleted' : 'Mark Completed ✓'}
          </button>
          <button class="small-button delete delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    </div>
  `).join("");

  setupCardListeners();
}

function setupCardListeners() {
  datesGrid.querySelectorAll(".toggle-complete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const currentComplete = btn.dataset.complete === "true";
      await supabase
        .from("date_ideas")
        .update({ complete: !currentComplete })
        .eq("id", btn.dataset.id);
      
      loadDates();
    });
  });

  datesGrid.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this date idea?")) {
        await supabase.from("date_ideas").delete().eq("id", btn.dataset.id);
        loadDates();
      }
    });
  });
}

// Random Date Picker (picks from uncompleted list)
rollDiceBtn.addEventListener("click", () => {
  const pendingDates = allDates.filter(d => !d.complete);

  if (!pendingDates.length) {
    alert("All date ideas are completed! Add some new ones to roll the dice.");
    return;
  }

  const randomIdea = pendingDates[Math.floor(Math.random() * pendingDates.length)];

  surpriseContent.innerHTML = `
    <h2 style="font-size:1.8rem; margin-bottom:8px;">${escapeHtml(randomIdea.title)}</h2>
    <p style="color:var(--accent); font-weight:600; text-transform:uppercase; font-size:0.8rem;">
      By ${escapeHtml(randomIdea.whose_idea)} • Timeline: ${escapeHtml(randomIdea.timeline)} • Location: ${escapeHtml(randomIdea.where_location)} • Cost: ${escapeHtml(randomIdea.cost)}
    </p>
    ${randomIdea.notes ? `<p style="margin-top:10px; color:var(--text);">"${escapeHtml(randomIdea.notes)}"</p>` : ""}
  `;

  surpriseCard.classList.remove("hidden");
  surpriseCard.scrollIntoView({ behavior: "smooth" });
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}