import { supabase } from "./supabase-client.js";
import { requireLogin } from "./auth.js";

const page = document.querySelector("#memory-page");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadMemory() {
  const auth = await requireLogin();
  if (auth.setupError) { showError("The site is not connected to Supabase yet."); return; }
  if (!id) {
    showError("No memory was selected.");
    return;
  }

  if (!supabase) {
    showError("The site is not connected to Supabase yet.");
    return;
  }

  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    showError("We couldn't find that memory.");
    console.error(error);
    return;
  }

  document.title = `${data.title} · Our Love Story`;

  page.innerHTML = `
    <div class="memory-layout">
      <div>
        ${data.image_url
          ? `<img class="memory-photo" src="${escapeAttr(data.image_url)}" alt="${escapeAttr(data.title)}">`
          : `<div class="memory-photo-placeholder" aria-hidden="true">♡</div>`}
      </div>

      <article class="memory-copy">
        <p class="eyebrow">Month ${escapeHtml(data.month_number)}</p>
        <h1>${escapeHtml(data.title)}</h1>
        ${data.date_label ? `<p class="memory-date">${escapeHtml(data.date_label)}</p>` : ""}
        <div class="memory-text">${escapeHtml(data.memory)}</div>
      </article>
    </div>
  `;
}

function showError(message) {
  page.innerHTML = `<div class="loading-card">${escapeHtml(message)}<br><br><a class="back-link" href="index.html">← Go home</a></div>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value = "") { return escapeHtml(value); }

loadMemory();
