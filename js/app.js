import { supabase } from "./supabase-client.js";
import { STORAGE_BUCKET } from "./config.js";

const grid = document.querySelector("#months-grid");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#month-count");

async function loadMonths() {
  if (!supabase) {
    grid.innerHTML = `<div class="loading-card">
      Add your Supabase URL and anon key in <code>js/config.js</code> first.
    </div>`;
    count.textContent = "Setup needed";
    return;
  }

  const { data, error } = await supabase
    .from("months")
    .select("*")
    .order("month_number", { ascending: true });

  if (error) {
    grid.innerHTML = `<div class="loading-card">Couldn't load memories. Check your Supabase setup.</div>`;
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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}

loadMonths();
