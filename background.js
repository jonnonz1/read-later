import { addItem } from "./lib/storage.js";

const CONTEXT_MENU_ID = "read-later-save-page";
const CONTEXT_MENU_LINK_ID = "read-later-save-link";

/**
 * Register context-menu entries. MV3 service workers may restart, so this is
 * idempotent via removeAll().
 */
async function registerMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Save page to Read Later",
    contexts: ["page", "action"],
  });
  chrome.contextMenus.create({
    id: CONTEXT_MENU_LINK_ID,
    title: "Save link to Read Later",
    contexts: ["link"],
  });
}

chrome.runtime.onInstalled.addListener(registerMenus);
chrome.runtime.onStartup.addListener(registerMenus);

/**
 * Briefly flash the toolbar badge to confirm a save.
 * @param {string} text
 */
async function flashBadge(text = "✓") {
  await chrome.action.setBadgeBackgroundColor({ color: "#b8860b" });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
}

/**
 * Save the active tab in the current window.
 */
async function saveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || tab.url.startsWith("chrome://")) return;
  await addItem({
    url: tab.url,
    title: tab.title,
    favicon: tab.favIconUrl || "",
  });
  await flashBadge();
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.url) {
    await addItem({ url: tab.url, title: tab.title, favicon: tab.favIconUrl });
    await flashBadge();
  }
  if (info.menuItemId === CONTEXT_MENU_LINK_ID && info.linkUrl) {
    await addItem({
      url: info.linkUrl,
      title: info.selectionText || info.linkUrl,
    });
    await flashBadge();
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-page") {
    await saveActiveTab();
  } else if (command === "open-list") {
    await chrome.tabs.create({ url: chrome.runtime.getURL("reader/reader.html") });
  }
});
