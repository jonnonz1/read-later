/**
 * Encode and decode reading-list share payloads into URL fragments.
 *
 * The fragment holds a gzipped, base64url-encoded JSON payload with short keys
 * to keep the URL compact. Because fragments (#...) are never sent to servers,
 * shared data stays peer-to-peer.
 */

import { PUBLIC_VIEWER_URL } from "./config.js";

const PAYLOAD_VERSION = 1;

/**
 * Base64url-encode a byte array (RFC 4648 §5, no padding).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Reverse of toBase64Url.
 * @param {string} s
 * @returns {Uint8Array}
 */
function fromBase64Url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Gzip a UTF-8 string via the platform CompressionStream API.
 * @param {string} str
 * @returns {Promise<Uint8Array>}
 */
async function gzip(str) {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Gunzip a byte array to a UTF-8 string.
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

/**
 * Encode a list of items into a URL-safe payload string.
 * @param {Array} items
 * @param {{title?: string}} [meta]
 * @returns {Promise<string>}
 */
export async function encodePayload(items, meta = {}) {
  const minimal = items.map((i) => ({
    u: i.url,
    t: i.title,
    g: i.tags?.length ? i.tags : undefined,
  }));
  const doc = { v: PAYLOAD_VERSION, n: meta.title || "", i: minimal };
  const bytes = await gzip(JSON.stringify(doc));
  return toBase64Url(bytes);
}

/**
 * Decode a payload string back into a list of items + metadata.
 * @param {string} payload
 * @returns {Promise<{title: string, items: Array}>}
 */
export async function decodePayload(payload) {
  const bytes = fromBase64Url(payload);
  const json = await gunzip(bytes);
  const doc = JSON.parse(json);
  if (doc.v !== PAYLOAD_VERSION) throw new Error("Unsupported share format");
  const items = (doc.i || []).map((i) => ({
    url: i.u,
    title: i.t || i.u,
    tags: i.g || [],
  }));
  return { title: doc.n || "", items };
}

/**
 * Build a full shareable URL for the given items. Uses the configured public
 * viewer if set, otherwise the in-extension viewer URL.
 * @param {Array} items
 * @param {{title?: string}} [meta]
 * @returns {Promise<string>}
 */
export async function buildShareUrl(items, meta) {
  const payload = await encodePayload(items, meta);
  const base =
    PUBLIC_VIEWER_URL ||
    (typeof chrome !== "undefined" && chrome.runtime
      ? chrome.runtime.getURL("share/viewer.html")
      : "viewer.html");
  return `${base}#${payload}`;
}
