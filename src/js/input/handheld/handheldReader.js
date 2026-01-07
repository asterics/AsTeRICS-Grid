// src/js/input/handheld/handheldReader.js

import { handleScanResult } from "./scanPipeline.js";

export class HandheldReader {
  constructor() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    console.log("[HandheldReader] enabled");
  }

  disable() {
    this.enabled = false;
    console.log("[HandheldReader] disabled");
  }

  // Testfunktion (simulierter Scan)
  simulateScan(text) {
    if (!this.enabled) return;
    handleScanResult(text);
  }
}
