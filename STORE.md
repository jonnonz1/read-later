# Publishing to the Chrome Web Store

A step-by-step checklist with the exact copy you'll need for each field.

## 0. Before you start

- **Bump `version`** in `manifest.json` on every submission (the store won't accept an upload with a version it already has).
- Make sure `icons/icon-{16,32,48,128}.png` exist. The `icons/build-icons.html` helper and the SVG source are dev-only and should be excluded from the zip.
- Decide on a privacy-policy host (GitHub README is fine). See §5.

## 1. Developer account

1. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).
2. Sign in with the Google account you want the listing under.
3. Pay the one-time **USD $5** developer registration fee.
4. Verify your contact email.

## 2. Package the extension

From the `read-later/` folder:

```bash
zip -r ../read-later.zip . \
  -x "*.DS_Store" \
  -x "icons/build-icons.html" \
  -x "icons/icon.svg" \
  -x "STORE.md" \
  -x "README.md"
```

The resulting `read-later.zip` is what you upload.

## 3. Store listing — copy to paste in

**Name** (≤ 45 chars)
> Read Later — a calm reading shelf

**Summary** (≤ 132 chars, shown in search results)
> Save articles to read later, browse them on a calm, nature-inspired shelf, and share reading lists with a single link.

**Category**
> Productivity

**Language**
> English (or whatever you prefer)

**Detailed description** (paste as-is)
```
Read Later is a quiet place to save the articles, essays, and pages you mean to come back to.

Features:
• Click the leaf in your toolbar to save the current tab — add tags if you like.
• Right-click any page or link → "Save to Read Later".
• Keyboard shortcuts: Ctrl/Cmd+Shift+L to save, Ctrl/Cmd+Shift+K to open your shelf.
• A full-tab reading shelf with search, tags, and filters for unread, read, and archived.
• Mark items as read, archive them, or delete.
• Light and dark themes that follow your system.

Share what you've saved:
• "Share link" generates a single URL that anyone can open — no account required.
• "Copy as Markdown" drops a clean reading list into Notion, Slack, email, or anywhere else.
• Per-item share copies the title + URL.
• JSON export/import for full portability and backups.

Your privacy:
Everything lives in your browser's local storage. Read Later has no servers, no accounts, and no analytics. Shared links carry their data in the URL fragment, which is never sent to any server.
```

## 4. Graphic assets

| Asset | Size | Required | Notes |
| --- | --- | --- | --- |
| Store icon | 128×128 PNG | yes | `icons/icon-128.png` works |
| Screenshot | 1280×800 or 640×400 PNG/JPG | at least 1, up to 5 | Show the reading shelf with a few items; show the popup |
| Small promo tile | 440×280 PNG/JPG | optional | Shown in the store grid |
| Marquee promo tile | 1400×560 PNG/JPG | optional | Only used if Chrome features you |

Quick way to make screenshots: install the extension locally, take screenshots at 1280×800 of the shelf (light + dark) and the popup, and save them to a `marketing/` folder.

## 5. Privacy practices tab

This is where reviews get stuck most often. Fill it in carefully.

**Single purpose**
> Save web pages to a personal reading list the user can browse, search, and share.

**Permission justifications**

| Permission | Justification |
| --- | --- |
| `storage` | Used to persist the user's reading list locally via `chrome.storage.local`. |
| `activeTab` | Used only when the user clicks the extension action or presses the save shortcut, to read the current tab's URL and title for saving. |
| `contextMenus` | Registers the "Save to Read Later" and "Save link to Read Later" right-click menu items. |
| `tabs` | Used to open the reading-shelf page in a new tab when the user presses the "Open shelf" shortcut or button. |

**Data usage — tick these**
- [x] This extension does not collect or transmit any user data.
- [x] I do not sell or transfer user data to third parties.
- [x] I do not use or transfer user data for purposes unrelated to the single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**

Use the GitHub-rendered page (nicely formatted for reviewers):

> <https://github.com/jonnonz1/read-later/blob/main/PRIVACY.md>

## 6. Visibility and distribution

- **Public** — listed in the store.
- **Unlisted** — reachable only with the direct URL; good for a private "share with friends" rollout.
- **Private** — restricted to a Google Group you specify.

Start with **Unlisted** while you test — you can flip to Public later without re-review.

## 7. Submit

1. Upload `read-later.zip` on the Package tab.
2. Fill in every required field (red asterisks) across the tabs.
3. Click **Submit for review**.

First-time reviews typically take 1–3 business days. Updates are often same-day.

## 8. After it's published

1. Your extension gets a **stable extension ID** (32 characters). Copy it.
2. If you want share links that work for anyone — not only people with the extension installed — host `share/viewer.html` on a public URL (GitHub Pages works in two minutes: push the file to a repo, enable Pages, use the raw URL).
3. Open `lib/config.js` and set `PUBLIC_VIEWER_URL` to that URL.
4. Bump the version and resubmit.

## 9. Ongoing: versioning

```bash
# bump manifest.json "version" → rebuild zip → upload
zip -r ../read-later.zip . -x "*.DS_Store" "icons/build-icons.html" "icons/icon.svg" "STORE.md" "README.md"
```

A small `CHANGELOG.md` helps reviewers and users understand what changed.
