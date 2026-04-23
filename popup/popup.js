import { addItem, getAllItems } from "../lib/storage.js";

const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const tagsEl = document.getElementById("tags");
const formEl = document.getElementById("save-form");
const tagline = document.getElementById("tagline");
const openListBtn = document.getElementById("open-list");
const recentSection = document.getElementById("recent-section");
const recentList = document.getElementById("recent-list");

const TAGLINES = [
  "A quiet shelf for what you meant to read.",
  "Let it rest here until you're ready.",
  "Slow reading is the best kind.",
  "The kettle's on. Save it for later.",
];

/**
 * Pre-fill the form with the current active tab.
 */
async function hydrateFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (tab.title) titleEl.value = tab.title;
  if (tab.url) urlEl.value = tab.url;
}

/**
 * Render the five most recent items under the form.
 */
async function renderRecent() {
  const items = (await getAllItems()).filter((i) => !i.archived).slice(0, 5);
  if (!items.length) {
    recentSection.hidden = true;
    return;
  }
  recentSection.hidden = false;
  recentList.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = item.favicon || faviconFallback(item.url);
    img.onerror = () => (img.style.visibility = "hidden");
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.title;
    li.append(img, a);
    recentList.append(li);
  }
}

/**
 * @param {string} url
 * @returns {string}
 */
function faviconFallback(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tags = tagsEl.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await addItem({
    url: urlEl.value,
    title: titleEl.value,
    tags,
  });
  tagline.textContent = "Tucked away. Rest easy.";
  tagline.classList.add("saved");
  tagsEl.value = "";
  await renderRecent();
  setTimeout(() => window.close(), 700);
});

openListBtn.addEventListener("click", async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL("reader/reader.html") });
  window.close();
});

(async () => {
  tagline.textContent = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  await hydrateFromActiveTab();
  await renderRecent();
})();
