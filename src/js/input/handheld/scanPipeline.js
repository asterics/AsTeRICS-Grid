// src/js/input/handheld/scanPipeline.js

export function normalizeScanText(raw) {
  if (!raw) return "";
  return String(raw).trim();
}

export function handleScanResult(rawText) {
  const text = normalizeScanText(rawText);

  if (!text) {
    console.warn("[HandheldReader] Empty scan result");
    return;
  }

  console.log("[HandheldReader] Scan result:", text);

  // TODO: Hier später Grid-Aktion auslösen
}
