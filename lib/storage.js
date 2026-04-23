/**
 * Shared data layer for the Read Later extension.
 * All reading-list state is stored under the STORAGE_KEY in chrome.storage.local.
 */

const STORAGE_KEY = "readLater.items.v1";

/**
 * Create a reasonably unique id without pulling in a dependency.
 * @returns {string}
 */
function makeId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Load every saved item, newest first.
 * @returns {Promise<Array>}
 */
export async function getAllItems() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const items = result[STORAGE_KEY] ?? [];
  return [...items].sort((a, b) => b.addedAt - a.addedAt);
}

/**
 * Replace the stored list wholesale.
 * @param {Array} items
 */
async function writeAll(items) {
  await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

/**
 * Add a new item. If the URL already exists, the existing entry is returned
 * unchanged so saving the same page twice is a no-op.
 * @param {{url: string, title?: string, favicon?: string, description?: string, tags?: string[]}} input
 * @returns {Promise<object>}
 */
export async function addItem(input) {
  const items = await getAllItems();
  const existing = items.find((i) => i.url === input.url);
  if (existing) return existing;

  const item = {
    id: makeId(),
    url: input.url,
    title: input.title?.trim() || input.url,
    favicon: input.favicon || "",
    description: input.description?.trim() || "",
    tags: (input.tags || []).map((t) => t.trim()).filter(Boolean),
    addedAt: Date.now(),
    readAt: null,
    archived: false,
  };
  await writeAll([item, ...items]);
  return item;
}

/**
 * Patch one item by id.
 * @param {string} id
 * @param {object} patch
 */
export async function updateItem(id, patch) {
  const items = await getAllItems();
  const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
  await writeAll(next);
}

/**
 * Remove an item by id.
 * @param {string} id
 */
export async function deleteItem(id) {
  const items = await getAllItems();
  await writeAll(items.filter((i) => i.id !== id));
}

/**
 * Remove every archived item. Returns the number purged.
 * @returns {Promise<number>}
 */
export async function clearArchive() {
  const items = await getAllItems();
  const remaining = items.filter((i) => !i.archived);
  await writeAll(remaining);
  return items.length - remaining.length;
}

/**
 * Merge imported items into the current list, skipping any URL that already
 * exists. Returns the number actually added.
 * @param {Array} incoming
 * @returns {Promise<number>}
 */
export async function importItems(incoming) {
  if (!Array.isArray(incoming)) throw new Error("Expected an array of items");
  const items = await getAllItems();
  const seen = new Set(items.map((i) => i.url));
  let added = 0;
  const merged = [...items];
  for (const raw of incoming) {
    if (!raw || typeof raw.url !== "string") continue;
    if (seen.has(raw.url)) continue;
    seen.add(raw.url);
    merged.push({
      id: makeId(),
      url: raw.url,
      title: (raw.title || raw.url).toString(),
      favicon: raw.favicon || "",
      description: raw.description || "",
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      addedAt: typeof raw.addedAt === "number" ? raw.addedAt : Date.now(),
      readAt: typeof raw.readAt === "number" ? raw.readAt : null,
      archived: !!raw.archived,
    });
    added++;
  }
  await writeAll(merged);
  return added;
}

/**
 * Collect the distinct tag set across all items.
 * @returns {Promise<string[]>}
 */
export async function allTags() {
  const items = await getAllItems();
  const tags = new Set();
  for (const i of items) for (const t of i.tags) tags.add(t);
  return [...tags].sort((a, b) => a.localeCompare(b));
}
