import {
  getAllItems,
  updateItem,
  deleteItem,
  clearArchive,
  importItems,
  allTags,
} from "../lib/storage.js";
import { buildShareUrl } from "../lib/share.js";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const emptyEl = document.getElementById("empty");
const emptyMsg = document.getElementById("empty-msg");
const statsEl = document.getElementById("stats");
const tagRow = document.getElementById("tag-row");
const toast = document.getElementById("toast");
const shareDialog = document.getElementById("share-dialog");
const shareDialogHeading = document.getElementById("share-dialog-heading");
const shareDialogTitle = document.getElementById("share-dialog-title");
const shareText = document.getElementById("share-text");
const shareLink = document.getElementById("share-link");
const shareNote = document.getElementById("share-note");
const shareCopyLinkBtn = document.getElementById("share-copy-link");
const shareCopyTextBtn = document.getElementById("share-copy-text");

const state = {
  filter: "unread", // unread | read | archived | all
  activeTag: null,
  query: "",
  items: [],
};

const SUBTITLES = [
  "Set down. Return when the light is right.",
  "What the tide left behind for you.",
  "Rest your eyes here.",
  "Slow reading is the best kind.",
];
document.getElementById("subtitle").textContent =
  SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];

/**
 * Pop a short confirmation message.
 * @param {string} msg
 */
function flash(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 200);
  }, 1800);
}

/**
 * Extract the hostname for display, falling back to the raw URL.
 * @param {string} url
 */
function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Friendly relative-time formatting.
 * @param {number} ts
 */
function ago(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

/**
 * Filter + search the in-memory list according to current state.
 * @returns {Array}
 */
function visibleItems() {
  const q = state.query.trim().toLowerCase();
  return state.items.filter((i) => {
    if (state.filter === "unread" && (i.readAt || i.archived)) return false;
    if (state.filter === "read" && (!i.readAt || i.archived)) return false;
    if (state.filter === "archived" && !i.archived) return false;
    if (state.activeTag && !i.tags.includes(state.activeTag)) return false;
    if (!q) return true;
    const hay = [i.title, i.url, i.description, ...(i.tags || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * @param {string} url
 */
function favicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

/**
 * Build a Markdown line for a single item.
 * @param {object} i
 */
function itemMarkdown(i) {
  const tags = i.tags?.length ? ` _(${i.tags.join(", ")})_` : "";
  return `- [${i.title}](${i.url})${tags}`;
}

/**
 * Render the whole list based on current state.
 */
function render() {
  const items = visibleItems();
  listEl.innerHTML = "";

  if (!items.length) {
    emptyEl.hidden = false;
    emptyMsg.textContent =
      state.filter === "unread"
        ? "Nothing unread. You're all caught up."
        : state.filter === "read"
          ? "No articles marked read yet."
          : state.filter === "archived"
            ? "The archive is empty."
            : state.query
              ? "Nothing matches that search."
              : "Nothing here yet. Save a page to begin.";
  } else {
    emptyEl.hidden = true;
  }

  for (const item of items) {
    listEl.append(renderItem(item));
  }

  const totalUnread = state.items.filter((i) => !i.readAt && !i.archived).length;
  statsEl.textContent = `${totalUnread} unread · ${state.items.length} total`;
}

/**
 * @param {object} item
 * @returns {HTMLElement}
 */
function renderItem(item) {
  const li = document.createElement("li");
  li.className = "item";
  if (item.readAt) li.classList.add("read");

  const head = document.createElement("div");
  head.className = "item-head";

  const fav = document.createElement("img");
  fav.className = "favicon";
  fav.src = item.favicon || favicon(item.url);
  fav.onerror = () => (fav.style.visibility = "hidden");

  const body = document.createElement("div");
  body.className = "item-body";

  const a = document.createElement("a");
  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "title-link";
  a.textContent = item.title;
  a.addEventListener("click", () => {
    if (!item.readAt) {
      updateItem(item.id, { readAt: Date.now() }).then(load);
    }
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  const hostSpan = document.createElement("span");
  hostSpan.className = "host";
  hostSpan.textContent = host(item.url);
  meta.append(hostSpan, dot(), span(ago(item.addedAt)));
  if (item.tags?.length) {
    meta.append(dot());
    const tagsWrap = document.createElement("span");
    tagsWrap.className = "tags";
    for (const t of item.tags) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t;
      tagsWrap.append(tag);
    }
    meta.append(tagsWrap);
  }

  const actions = document.createElement("div");
  actions.className = "item-actions";
  actions.append(
    actionBtn(item.readAt ? "Mark unread" : "Mark read", async () => {
      await updateItem(item.id, { readAt: item.readAt ? null : Date.now() });
      await load();
    }),
    actionBtn(item.archived ? "Unarchive" : "Archive", async () => {
      await updateItem(item.id, { archived: !item.archived });
      await load();
    }),
    actionBtn("Share", () => openShareDialog([item])),
    actionBtn("Copy link", async () => {
      await navigator.clipboard.writeText(item.url);
      flash("Link copied");
    }),
    actionBtn("Delete", async () => {
      await deleteItem(item.id);
      await load();
      flash("Removed");
    }, "danger"),
  );

  body.append(a, meta, actions);
  head.append(fav, body);
  li.append(head);
  return li;
}

function dot() {
  const d = document.createElement("span");
  d.className = "dot";
  d.textContent = "·";
  return d;
}

function span(text) {
  const s = document.createElement("span");
  s.textContent = text;
  return s;
}

function actionBtn(label, onClick, extraClass = "") {
  const b = document.createElement("button");
  b.className = `link-btn ${extraClass}`.trim();
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

/**
 * Reload items from storage and re-render.
 */
async function load() {
  state.items = await getAllItems();
  await renderTagRow();
  render();
}

/**
 * Render the tag chips. Active tag is highlighted.
 */
async function renderTagRow() {
  const tags = await allTags();
  tagRow.innerHTML = "";
  if (!tags.length) return;
  for (const t of tags) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.dataset.tag = t;
    chip.textContent = `# ${t}`;
    if (state.activeTag === t) chip.classList.add("active");
    chip.addEventListener("click", () => {
      state.activeTag = state.activeTag === t ? null : t;
      renderTagRow();
      render();
    });
    tagRow.append(chip);
  }
}

searchEl.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

document.querySelectorAll(".filters .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelectorAll(".filters .chip")
      .forEach((c) => c.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
    state.filter = chip.dataset.filter;
    render();
  });
});

/**
 * Open the share dialog for either a single item or a list of items.
 * @param {Array} items
 * @param {{heading?: string, subtitle?: string, listTitle?: string}} [opts]
 */
async function openShareDialog(items, opts = {}) {
  const isSingle = items.length === 1;
  shareDialogHeading.textContent =
    opts.heading ?? (isSingle ? "Share this article" : `Share ${items.length} articles`);
  shareDialogTitle.textContent =
    opts.subtitle ??
    (isSingle
      ? items[0].title
      : opts.listTitle || "From your reading shelf");

  shareText.value = isSingle
    ? `${items[0].title}\n${items[0].url}${items[0].tags?.length ? `\n\nTags: ${items[0].tags.join(", ")}` : ""}`
    : items
        .map((i) => {
          const tags = i.tags?.length ? ` (${i.tags.join(", ")})` : "";
          return `• ${i.title}${tags}\n  ${i.url}`;
        })
        .join("\n\n");

  shareLink.value = "Generating...";
  shareNote.textContent = "";
  shareDialog.showModal();

  try {
    const url = await buildShareUrl(items, { title: opts.listTitle });
    shareLink.value = url;
    shareNote.textContent =
      url.startsWith("chrome-extension://")
        ? "Only people with the Read Later extension can open this link. Host share/viewer.html publicly and set PUBLIC_VIEWER_URL in lib/config.js for a universal link."
        : "Anyone can open this link in their browser — no extension required.";
  } catch (err) {
    shareLink.value = "";
    shareNote.textContent = "Couldn't generate a link.";
    console.error(err);
  }
}

shareCopyLinkBtn.addEventListener("click", async () => {
  if (!shareLink.value || shareLink.value === "Generating...") return;
  await navigator.clipboard.writeText(shareLink.value);
  flash("Link copied");
  shareDialog.close();
});

shareCopyTextBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(shareText.value);
  flash("Text copied");
  shareDialog.close();
});

document.getElementById("share-link-btn").addEventListener("click", async () => {
  const visible = visibleItems();
  if (!visible.length) return flash("Nothing to share");
  const listTitle = state.activeTag ? `Reading list — #${state.activeTag}` : "My reading list";
  await openShareDialog(visible, { listTitle });
});

document.getElementById("share-md-btn").addEventListener("click", async () => {
  const visible = visibleItems();
  if (!visible.length) return flash("Nothing to share");
  const title = state.activeTag ? `Reading list — #${state.activeTag}` : "My reading list";
  const md = `## ${title}\n\n${visible.map(itemMarkdown).join("\n")}\n`;
  await navigator.clipboard.writeText(md);
  flash(`Copied ${visible.length} ${visible.length === 1 ? "item" : "items"} as Markdown`);
});

document.getElementById("export-btn").addEventListener("click", async () => {
  const items = await getAllItems();
  const blob = new Blob([JSON.stringify({ version: 1, items }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `read-later-${stamp}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash(`Exported ${items.length} items`);
});

document.getElementById("import-input").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.items;
    const added = await importItems(incoming);
    flash(`Added ${added} new ${added === 1 ? "item" : "items"}`);
    await load();
  } catch (err) {
    flash("Couldn't read that file");
    console.error(err);
  } finally {
    e.target.value = "";
  }
});

document.getElementById("clear-archive").addEventListener("click", async () => {
  const purged = await clearArchive();
  await load();
  flash(purged ? `Cleared ${purged} archived` : "Nothing archived");
});

load();
