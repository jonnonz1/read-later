# Privacy policy — Read Later

_Last updated: 2026-04-23_

Read Later is designed to do its job without collecting anything about you.

## What data is stored

Your reading list — the URLs, titles, tags, and read/archived flags you save — is stored **locally in your browser** using the `chrome.storage.local` API. It never leaves your device through this extension.

## What is transmitted

- **Nothing to a Read Later server.** There is no Read Later server. The extension has no backend, no analytics, no telemetry, and no accounts.
- **Favicon requests.** When a page you save did not provide a favicon, the extension requests a small icon image from Google's public favicon service (`https://www.google.com/s2/favicons`) using only the domain name of the saved page. This is the same request Chrome itself makes to display page icons.
- **Pages you open.** When you click a saved article, your browser loads it directly from that article's own server, the same as any normal link click. Read Later is not involved in that request.

## Shared links

When you create a shareable link through Read Later, the reading-list data is encoded into the URL's **fragment** (the part after `#`). Browsers do **not** send URL fragments to servers. Anyone you give the link to can open it to view the shared items; no server ever sees the fragment data.

The share viewer page is a plain static HTML file. It does not log, track, or transmit anything when it's opened.

## What we don't do

- We do not sell or transfer user data to third parties.
- We do not use or transfer user data for purposes unrelated to saving and sharing reading-list items.
- We do not use or transfer user data to determine creditworthiness or for lending purposes.

## Permissions the extension requests

- `storage` — to persist your reading list in `chrome.storage.local`.
- `activeTab` — to read the current tab's URL and title when you click Save.
- `contextMenus` — to add "Save to Read Later" to the right-click menu.
- `tabs` — to open the reading-shelf page in a new tab.

No host permissions are requested; the extension does not run on the pages you browse.

## Contact

Source code and issues: <https://github.com/jonnonz1/read-later>
