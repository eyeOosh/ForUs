import { supabase } from "./supabase-client.js";
import { STORAGE_BUCKET } from "./config.js";

const authSection = document.querySelector("#auth-section");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const memoryForm = document.querySelector("#memory-form");
const formMessage = document.querySelector("#form-message");
const adminList = document.querySelector("#admin-list");
const adminCount = document.querySelector("#admin-count");
const logoutButton = document.querySelector("#logout-button");
const cancelEdit = document.querySelector("#cancel-edit");
const formTitle = document.querySelector("#form-title");
const saveLabel = document.querySelector("#save-label");
const photoInput = document.querySelector("#photo");
const previewWrap = document.querySelector("#image-preview-wrap");
const preview = document.querySelector("#image-preview");

let currentUser = null;
let editing = null;

if (!supabase) {
  loginMessage.textContent = "Add your Supabase URL and anon key in js/config.js first.";
  loginForm.querySelector("button").disabled = true;
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuth();
  });
  checkSession();
}

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  renderAuth();
}

function renderAuth() {
  if (currentUser) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadAdminMonths();
  } else {
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Signing in…");

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(loginMessage, error.message, true);
  } else {
    setMessage(loginMessage, "");
  }
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    previewWrap.classList.add("hidden");
    return;
  }
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
});

memoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const monthNumber = Number(document.querySelector("#month-number").value);
  const title = document.querySelector("#title").value.trim();
  const dateLabel = document.querySelector("#date-label").value.trim();
  const memory = document.querySelector("#memory").value.trim();
  const file = photoInput.files[0];

  if (!Number.isInteger(monthNumber) || monthNumber < 1) {
    setMessage(formMessage, "Month number must be 1 or higher.", true);
    return;
  }

  if (file && file.size > 8 * 1024 * 1024) {
    setMessage(formMessage, "That image is larger than 8 MB.", true);
    return;
  }

  setMessage(formMessage, editing ? "Updating memory…" : "Saving memory…");
  const button = memoryForm.querySelector("button[type=submit]");
  button.disabled = true;

  try {
    let imageUrl = editing?.image_url ?? null;

    if (file) {
      imageUrl = await uploadPhoto(file, monthNumber);
    }

    const payload = {
      month_number: monthNumber,
      title,
      date_label: dateLabel || null,
      memory,
      image_url: imageUrl
    };

    if (editing) {
      const { error } = await supabase
        .from("months")
        .update(payload)
        .eq("id", editing.id);
      if (error) throw error;
      setMessage(formMessage, "Memory updated. ♡", false, true);
    } else {
      const { error } = await supabase
        .from("months")
        .insert(payload);
      if (error) throw error;
      setMessage(formMessage, "New month added. ♡", false, true);
    }

    resetForm();
    await loadAdminMonths();
  } catch (error) {
    console.error(error);
    setMessage(formMessage, error.message || "Something went wrong.", true);
  } finally {
    button.disabled = false;
  }
});

cancelEdit.addEventListener("click", resetForm);

async function uploadPhoto(file, monthNumber) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}-month-${monthNumber}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

async function loadAdminMonths() {
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .order("month_number", { ascending: true });

  if (error) {
    adminList.innerHTML = `<div class="loading-card">Couldn't load your months. Check your RLS policies.</div>`;
    console.error(error);
    return;
  }

  adminCount.textContent = data.length;

  if (!data.length) {
    adminList.innerHTML = `<div class="loading-card">No months yet. Add your first one on the left. ♡</div>`;
    return;
  }

  adminList.innerHTML = data.map(month => `
    <div class="admin-item">
      ${month.image_url
        ? `<img src="${escapeAttr(month.image_url)}" alt="">`
        : `<div class="admin-item-placeholder">♡</div>`}
      <div>
        <h3>Month ${escapeHtml(month.month_number)} · ${escapeHtml(month.title)}</h3>
        <p>${escapeHtml(month.date_label || "No date label")}</p>
      </div>
      <div class="item-actions">
        <button class="small-button edit" data-id="${escapeAttr(month.id)}">Edit</button>
        <button class="small-button delete" data-id="${escapeAttr(month.id)}">Delete</button>
      </div>
    </div>
  `).join("");

  adminList.querySelectorAll(".edit").forEach(button => {
    button.addEventListener("click", () => startEdit(data.find(m => m.id === button.dataset.id)));
  });

  adminList.querySelectorAll(".delete").forEach(button => {
    button.addEventListener("click", () => deleteMonth(button.dataset.id));
  });
}

function startEdit(month) {
  if (!month) return;
  editing = month;

  document.querySelector("#memory-id").value = month.id;
  document.querySelector("#month-number").value = month.month_number;
  document.querySelector("#title").value = month.title;
  document.querySelector("#date-label").value = month.date_label || "";
  document.querySelector("#memory").value = month.memory;

  formTitle.textContent = "Edit month";
  saveLabel.textContent = "Update month";
  cancelEdit.classList.remove("hidden");
  setMessage(formMessage, "Editing this memory.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteMonth(id) {
  if (!confirm("Delete this month from the website? This cannot be undone.")) return;

  const { error } = await supabase.from("months").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  if (editing?.id === id) resetForm();
  await loadAdminMonths();
}

function resetForm() {
  editing = null;
  memoryForm.reset();
  document.querySelector("#memory-id").value = "";
  formTitle.textContent = "Add a month";
  saveLabel.textContent = "Save month";
  cancelEdit.classList.add("hidden");
  previewWrap.classList.add("hidden");
  setMessage(formMessage, "");
}

function setMessage(element, text, error = false, success = false) {
  element.textContent = text;
  element.className = "form-message";
  if (error) element.classList.add("error");
  if (success) element.classList.add("success");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value = "") { return escapeHtml(value); }
