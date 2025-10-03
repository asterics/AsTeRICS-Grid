SherpaONNX WebAssembly (WASM) runtime setup for AsTeRICS-Grid

This folder is where you can place the SherpaONNX TTS WASM assets to enable the "SherpaONNX (WASM)" provider in the browser.

Required files (place both in this directory):
- sherpaonnx.js   (WASM glue script)
- sherpaonnx.wasm (WASM binary)

How to obtain the files:
- See the official project and web TTS examples:
  - https://github.com/k2-fsa/sherpa-onnx
  - Web TTS demo paths typically include files named like above

Notes:
- Our app passes wasmBaseUrl: "app/vendor/sherpa-onnx" to the js-tts-wrapper client. The runtime will auto-load sherpaonnx.js and resolve sherpaonnx.wasm from this folder.
- Voice list: the engine fetches models from app/data/merged_models.json by default here (we added a minimal file to get you started). You can replace it with your own.

Troubleshooting:
- Ensure that sherpaonnx.wasm is served with correct MIME type (application/wasm).
- If you want to host the assets elsewhere, set wasmBaseUrl or wasmPath in the SherpaONNX provider settings once we expose those in the UI (coming soon), or adjust defaults in voiceProviderService.
