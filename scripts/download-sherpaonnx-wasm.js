#!/usr/bin/env node
/*
  Download SherpaONNX WASM runtime files for browser TTS.

  Usage:
    SHERPAONNX_WASM_BASEURL="https://your.host/path/to/wasm/tts" \
      node scripts/download-sherpaonnx-wasm.js

  Expected files at ${BASE}/ (two common variants exist; this script tries both):
    Variant A (TTS naming used in HF spaces):
      - sherpa-onnx-tts.js
      - sherpa-onnx-wasm-main-tts.wasm
      - sherpa-onnx-wasm-main-tts.data
    Variant B (generic naming):
      - sherpa-onnx.js
      - sherpa-onnx-wasm-main.wasm
      - sherpa-onnx-wasm-main.data

  Destination:
    app/vendor/sherpa-onnx/

  Notes:
  - We don't commit these binaries. You can host them yourself or point to a
    release/cdn URL via SHERPAONNX_WASM_BASEURL.
  - Docs: https://k2-fsa.github.io/sherpa/onnx/tts/wasm/build.html
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = process.env.SHERPAONNX_WASM_BASEURL || '';
const DEST_DIR = path.join(__dirname, '..', 'app', 'vendor', 'sherpa-onnx');
const VARIANTS = [
  {
    name: 'tts',
    files: [
      'sherpa-onnx-tts.js',
      'sherpa-onnx-wasm-main-tts.js',
      'sherpa-onnx-wasm-main-tts.wasm',
      'sherpa-onnx-wasm-main-tts.data',
    ],
  },
  {
    name: 'generic',
    files: [
      'sherpa-onnx.js',
      'sherpa-onnx-wasm-main.wasm',
      'sherpa-onnx-wasm-main.data',
    ],
  },
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch (_) { return false; }
}

function toAbsoluteUrl(baseUrl, location) {
  try {
    const u = new URL(location);
    return u.toString();
  } catch {
    // relative redirect
    try {
      const b = new URL(baseUrl);
      return `${b.origin}${location.startsWith('/') ? '' : '/'}${location}`;
    } catch {
      return location; // give up
    }
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect, convert relative to absolute
        const nextUrl = toAbsoluteUrl(url, res.headers.location);
        res.destroy();
        return resolve(download(nextUrl, dest));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  ensureDir(DEST_DIR);

  // If no base URL provided, just print instructions and exit gracefully
  if (!BASE) {
    console.log('[sherpa:fetch] No SHERPAONNX_WASM_BASEURL provided.');
    console.log('  Please set it to a directory that contains:');
    console.log('   - sherpa-onnx.js');
    console.log('   - sherpa-onnx-wasm-main.wasm');
    console.log('   - sherpa-onnx-wasm-main.data');
    console.log('  Docs to build/locate assets: https://k2-fsa.github.io/sherpa/onnx/tts/wasm/build.html');
    console.log('  Example:');
    console.log('    SHERPAONNX_WASM_BASEURL=https://your.cdn/sherpa-onnx-wasm/tts yarn sherpa:fetch');
    process.exit(0);
  }

  let anyDownloaded = false;
  for (const variant of VARIANTS) {
    const base = BASE.replace(/\/$/, '');
    console.log(`[sherpa:fetch] Trying variant: ${variant.name}`);
    for (const f of variant.files) {
      const dest = path.join(DEST_DIR, f);
      if (fileExists(dest)) {
        console.log(`[sherpa:fetch] Exists: ${dest}`);
        continue;
      }
      const url = `${base}/${f}`;
      console.log(`[sherpa:fetch] Downloading ${url} -> ${dest}`);
      try {
        await download(url, dest);
        anyDownloaded = true;
        console.log(`[sherpa:fetch] OK: ${f}`);
      } catch (e) {
        console.warn(`[sherpa:fetch] Failed to download ${f}: ${e.message}`);
      }
    }
  }

  // Post-check: do we have at least one working set present?
  const haveTts = ['sherpa-onnx-tts.js','sherpa-onnx-wasm-main-tts.wasm','sherpa-onnx-wasm-main-tts.data']
    .every(f => fileExists(path.join(DEST_DIR, f)));
  const haveGeneric = ['sherpa-onnx.js','sherpa-onnx-wasm-main.wasm','sherpa-onnx-wasm-main.data']
    .every(f => fileExists(path.join(DEST_DIR, f)));

  if (!haveTts && !haveGeneric && !anyDownloaded) {
    console.warn('[sherpa:fetch] No files downloaded. Ensure SHERPAONNX_WASM_BASEURL points to a directory containing one of the supported variants.');
    console.warn('  Example (HuggingFace TTS space):');
    console.warn('  SHERPAONNX_WASM_BASEURL=https://huggingface.co/spaces/k2-fsa/web-assembly-tts-sherpa-onnx-en/resolve/main');
  } else {
    console.log('[sherpa:fetch] Done. If you used the TTS variant, our default path expects sherpa-onnx-tts.js.');
  }
})();

