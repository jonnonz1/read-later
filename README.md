# Read Later

A calm Chrome extension for saving, revisiting, and sharing the things you mean to read. The aesthetic is nature-quiet — warm parchment, moss green, soft terracotta, a serif for titles.

## Features

- **Quick save** — toolbar popup pre-fills the current tab's title and URL. Add tags, save, done.
- **Reading shelf** — a full-tab view to browse, search, filter by read/unread/archived, and filter by tag.
- **Context menu** — right-click a page or a link to save it.
- **Shortcuts** — `Ctrl/Cmd+Shift+L` save current page · `Ctrl/Cmd+Shift+K` open the shelf.
- **Share an article** — per-item "Share" copies the title + URL for pasting into any app.
- **Share the whole shelf** — "Copy as Markdown" produces a clean list you can drop into email, Notion, Slack, or anywhere.
- **Portable** — JSON export/import lets anyone hand their reading list to anyone else running the extension.
- **Light/dark** — follows your system theme.

## Install (unpacked)

1. Open `icons/build-icons.html` in your browser and click **Generate and download**. Save the four PNG files (`icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`) into the `icons/` directory. This step only needs to happen once.
2. Visit `chrome://extensions`.
3. Toggle **Developer mode** on (top right).
4. Click **Load unpacked** and select the `read-later/` folder.
5. Pin the leaf icon to your toolbar.

## Files

```
read-later/
├── manifest.json        Chrome MV3 manifest
├── background.js        service worker — context menu, shortcuts, badge flash
├── lib/
│   └── storage.js       data layer (chrome.storage.local)
├── popup/               toolbar popup — quick save
├── reader/              full-tab reading shelf — search, filter, share
└── icons/               icon source + one-time PNG generator
```

## Data model

Each item:

```ts
{
  id: string,
  url: string,
  title: string,
  favicon: string,
  description: string,
  tags: string[],
  addedAt: number,        // epoch ms
  readAt: number | null,
  archived: boolean
}
```

Everything lives in `chrome.storage.local` — nothing is sent to a server.

## Sharing

- **Single item** → click **Share** on a row → copy the formatted title + URL.
- **Whole shelf (or a filtered slice)** → top-right **Copy as Markdown** respects your current filter/search/tag, so you can share just the "gardening" tag if you want.
- **Full backup or hand-off** → **Export** produces a JSON file; the recipient clicks **Import** to merge it in (duplicates by URL are skipped).
