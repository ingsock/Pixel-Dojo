"use strict";

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function cloneImageData(imageData) { return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
function clamp01(value) { return clamp(value, 0, 1); }
function clampByte(value) { return clamp(Math.round(value), 0, 255); }
function formatNumber(value, digits = 2) { const rounded = Number((Number(value) || 0).toFixed(digits)); return Object.is(rounded, -0) ? "0" : String(rounded); }
function wrapHue(value) { return ((value % 360) + 360) % 360; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

