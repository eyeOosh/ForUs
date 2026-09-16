import { supabase } from "./supabase-client.js";
import { STORAGE_BUCKET } from "./config.js";

const loginScreen = document.querySelector("#login-screen");
const siteContent = document.querySelector("#site-content");
const loginForm = document.querySelector("#site-login-form");
const loginMessage = document.querySelector("#site-login-message");
const logoutButton = document.querySelector("#site-logout");
const grid = document.querySelector("#months-grid");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#month-count");

if (!supabase) {
  setMessage(loginMessage, "Connect Supabase in js/config.js first.", true);
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showSite();
      loadMonths();
    } else {
      showLogin();
    }
  });

  checkSession();
}

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    showSite();
    loadMonths();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  siteContent.classList.add("hidden");
}

function showSite() {
  loginScreen.classList.add("hidden");
  siteContent.classList.remove("hidden");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Opening our memories…");

  const email = document.querySelector("#site-email").value.trim();
  const password = document.querySelector("#site-password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) setMessage(loginMessage, error.message, true);
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

async function loadMonths() {
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .order("month_number", { ascending: true });

  if (error) {
    grid.innerHTML = `<div class="loading-card">Couldn't load our memories.</div>`;
    console.error(error);
    return;
  }

  count.textContent = `${data.length} ${data.length === 1 ? "chapter" : "chapters"}`;

  if (!data.length) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  grid.innerHTML = data.map(month => `
    <a class="month-card" href="month.html?id=${encodeURIComponent(month.id)}">
      ${month.image_url
        ? `<img class="card-image" src="${escapeAttr(month.image_url)}" alt="${escapeAttr(month.title)}" loading="lazy">`
        : `<div class="card-placeholder" aria-hidden="true">♡</div>`}
      <div class="card-content">
        <div class="card-month">Month ${escapeHtml(month.month_number)}</div>
        <h3 class="card-title">${escapeHtml(month.title)}</h3>
        <div class="card-date">${escapeHtml(month.date_label || "")}</div>
      </div>
    </a>
  `).join("");
}

function setMessage(element, text, error = false) {
  element.textContent = text;
  element.className = "form-message" + (error ? " error" : "");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function escapeAttr(value = "") { return escapeHtml(value); }
