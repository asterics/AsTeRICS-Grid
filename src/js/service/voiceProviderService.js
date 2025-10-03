
import { createBrowserTTSClient } from "js-tts-wrapper/browser";
import { constants } from "../util/constants";


// Helper: load a script once
async function loadScriptOnce(url) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            if (existing.dataset.loaded === "true") return resolve();
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error(`Failed to load ${url}`)));
            return;
        }
        const s = document.createElement("script");
        s.src = url;
        s.async = true;
        s.dataset.loaded = "false";
        s.onload = () => {
            s.dataset.loaded = "true";
            resolve();
        };
        s.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(s);
    });
}

// Ensure the SherpaONNX (HF TTS variant) runtime is present: Module.calledRun + createOfflineTts
async function ensureSherpaWasmRuntime(engineConfig = {}) {
    if (typeof window === "undefined") return;
    const w = window;
    const base = (engineConfig.wasmBaseUrl)
        || (engineConfig.wasmPath ? engineConfig.wasmPath.replace(/\/[^/]*$/, "") : "app/vendor/sherpa-onnx");
    const b = base.replace(/\/$/, "");

    // If already ready, skip
    if (typeof w.createOfflineTts === "function" && w.Module && w.Module.calledRun) return;

    w.Module = w.Module || {};
    // Make sure the Emscripten glue can find .wasm/.data next to it
    w.Module.locateFile = (p) => `${b}/${p}`;

    // Load Emscripten main glue (initializes Module + calledRun) first
    await loadScriptOnce(`${b}/sherpa-onnx-wasm-main-tts.js`);
    // Then load the TTS wrapper that exposes createOfflineTts if still missing
    if (typeof w.createOfflineTts !== "function") {
        await loadScriptOnce(`${b}/sherpa-onnx-tts.js`);
    }

    // Wait until ready
    await new Promise((resolve, reject) => {
        const giveUpAt = Date.now() + 15000;
        const check = () => {
            if (typeof w.createOfflineTts === "function" && w.Module && w.Module.calledRun) return resolve();
            if (Date.now() > giveUpAt) return reject(new Error("Timed out waiting for SherpaONNX WASM (HF TTS variant)"));
            setTimeout(check, 200);
        };
        check();
    });
}

const PROVIDER_DEFINITIONS = [
    { id: constants.VOICE_PROVIDER_SYSTEM, labelKey: "voiceProviderSystemDefault", type: "native" },
    { id: constants.VOICE_PROVIDER_EXTERNAL, labelKey: "voiceProviderExternalBridge", type: "external" },
    { id: constants.VOICE_PROVIDER_AZURE, labelKey: "voiceProviderAzure", type: "js", engine: "azure", requiredConfig: ["subscriptionKey", "region"] },
    { id: constants.VOICE_PROVIDER_ELEVENLABS, labelKey: "voiceProviderElevenlabs", type: "js", engine: "elevenlabs", requiredConfig: ["apiKey"] },
    { id: constants.VOICE_PROVIDER_WATSON, labelKey: "voiceProviderWatson", type: "js", engine: "watson", requiredConfig: ["apiKey", "region", "instanceId"] },
    { id: constants.VOICE_PROVIDER_WITAI, labelKey: "voiceProviderWitai", type: "js", engine: "witai", requiredConfig: ["token"] },
    { id: constants.VOICE_PROVIDER_UPLIFTAI, labelKey: "voiceProviderUpliftai", type: "js", engine: "upliftai", requiredConfig: ["apiKey"] },
    { id: constants.VOICE_PROVIDER_PLAYHT, labelKey: "voiceProviderPlayht", type: "js", engine: "playht", requiredConfig: ["apiKey", "userId"] },
    { id: constants.VOICE_PROVIDER_POLLY, labelKey: "voiceProviderPolly", type: "js", engine: "polly", requiredConfig: ["region", "accessKeyId", "secretAccessKey"] },
    { id: constants.VOICE_PROVIDER_OPENAI, labelKey: "voiceProviderOpenai", type: "js", engine: "openai", requiredConfig: ["apiKey"] },
    { id: constants.VOICE_PROVIDER_GOOGLE, labelKey: "voiceProviderGoogle", type: "js", engine: "google", requiredConfig: ["apiKey"] },
    { id: constants.VOICE_PROVIDER_SHERPAONNX_WASM, labelKey: "voiceProviderSherpaOnnxWasm", type: "js", engine: "sherpaonnx-wasm", requiredConfig: [] }
];

const clientCache = new Map(); // providerId -> { client, configKey }
let currentPlayingProviderId = null;

async function checkCredentials(providerId, config) {
    const provider = getProviderDefinition(providerId);
    if (!provider || provider.type !== "js") {
        return { success: true };
    }
    if (!isConfigComplete(provider, config)) {
        return { success: false, error: 'missingConfiguration' };
    }
    try {
        const client = createBrowserTTSClient(provider.engine, config || {});
        let result = true;
        if (typeof client.checkCredentials === 'function') {
            result = await client.checkCredentials();
        }
        if (typeof result === 'object' && result !== null) {
            if (Object.prototype.hasOwnProperty.call(result, 'success')) {
                return result;
            }
            return Object.assign({ success: true }, result);
        }
        return { success: result !== false };
    } catch (error) {
        const message = error && error.message ? error.message : String(error);
        return { success: false, error: message };
    }
}

function getProviderDefinition(providerId) {
    return PROVIDER_DEFINITIONS.find((provider) => provider.id === providerId) || null;
}

function isProviderSupportedInEnv(_provider) {
    // With js-tts-wrapper >= 0.1.51, Google & Polly support browser via REST, and SherpaONNX can auto-load WASM.
    // Keep this hook for future environment gating if needed.
    return true;
}

function getProviders() {
    return PROVIDER_DEFINITIONS.slice();
}

function providerRequiresConfig(provider) {
    return (provider.requiredConfig || []).length > 0;
}

function isConfigComplete(provider, config) {
    if (!providerRequiresConfig(provider)) {
        return true;
    }
    if (!config) {
        return false;
    }
    return provider.requiredConfig.every((key) => !!config[key]);
}

function rateToProsody(rate) {
    if (typeof rate !== "number" || Number.isNaN(rate)) {
        return undefined;
    }
    const clamped = Math.max(0.25, Math.min(rate, 4));
    const percentage = Math.round(clamped * 100);
    return `${percentage}%`;
}

function pitchToProsody(pitch) {
    if (typeof pitch !== "number" || Number.isNaN(pitch)) {
        return undefined;
    }
    const clamped = Math.max(0.25, Math.min(pitch, 4));
    const percentage = Math.round(clamped * 100);
    return `${percentage}%`;
}

async function ensureClient(provider, config) {
    if (provider.type !== "js") {
        return null;
    }
    const configKey = JSON.stringify(config || {});
    const cached = clientCache.get(provider.id);
    if (cached && cached.configKey === configKey) {
        return cached.client;
    }
    if (cached && cached.client) {
        try {
            cached.client.stop();
        } catch (e) {
            console.warn("Failed to stop previous TTS client", provider.id, e);
        }
    }
    const engineConfig = { ...(config || {}) };
    // Provide sensible defaults for SherpaONNX WASM auto-loading
    if (provider.engine === "sherpaonnx-wasm") {
        if (!engineConfig.wasmPath && !engineConfig.wasmBaseUrl) {
            // Prefer explicit TTS glue path from official HF space naming
            engineConfig.wasmPath = "app/vendor/sherpa-onnx/sherpa-onnx-tts.js";
        }
        if (!engineConfig.mergedModelsUrl) {
            engineConfig.mergedModelsUrl = "app/data/merged_models.json";
        }
    }
    // For SherpaONNX WASM (HF TTS), proactively ensure runtime pieces are present
    if (provider.engine === "sherpaonnx-wasm") {
        try {
            await ensureSherpaWasmRuntime(engineConfig);
        } catch (e) {
            console.warn("SherpaONNX WASM pre-init did not complete:", e?.message || e);
        }
    }
    const client = createBrowserTTSClient(provider.engine, engineConfig);
    client.on?.("start", () => {
        currentPlayingProviderId = provider.id;
    });
    client.on?.("end", () => {
        if (currentPlayingProviderId === provider.id) {
            currentPlayingProviderId = null;
        }
    });
    clientCache.set(provider.id, { client, configKey });
    return client;
}

async function listVoices(providerId, config) {
    const provider = getProviderDefinition(providerId);
    if (!provider || provider.type !== "js") {
        return [];
    }
    if (!isProviderSupportedInEnv(provider)) {
        return [];
    }
    if (!isConfigComplete(provider, config)) {
        return [];
    }
    try {
        const client = await ensureClient(provider, config);
        if (!client) {
            return [];
        }
        const voices = await client.getVoices();
        // Normalize Sherpa voices to include languageCodes for filtering in settingsLanguage.vue
        if (provider.engine === "sherpaonnx-wasm" && Array.isArray(voices)) {
            return voices.map(v => {
                if (!v.languageCodes && v.language) {
                    return { ...v, languageCodes: [{ bcp47: v.language }] };
                }
                return v;
            });
        }
        return voices;
    } catch (error) {
        console.warn("Failed to fetch voices for provider", providerId, error);
        return [];
    }
}

async function speak(providerId, voiceId, text, config, options = {}) {
    const provider = getProviderDefinition(providerId);
    if (!provider || provider.type !== "js") {
        return false;
    }
    if (!isProviderSupportedInEnv(provider)) {
        console.warn("TTS provider not supported in current environment", providerId);
        return false;
    }
    if (!isConfigComplete(provider, config)) {
        console.warn("TTS provider configuration incomplete", providerId);
        return false;
    }
    try {
        const client = await ensureClient(provider, config);
        if (!client) {
            return false;
        }
        if (voiceId) {
            client.setVoice(voiceId);
        }
        const rate = rateToProsody(options.rate);
        const pitch = pitchToProsody(options.pitch);
        if (rate) {
            client.setProperty?.("rate", rate);
        }
        if (pitch) {
            client.setProperty?.("pitch", pitch);
        }
        await client.speak(text);
        return true;
    } catch (error) {
        console.error("Failed to speak via provider", providerId, error);
        return false;
    }
}

function stop(providerId) {
    if (providerId) {
        const cached = clientCache.get(providerId);
        if (cached && cached.client) {
            try {
                cached.client.stop();
            } catch (error) {
                console.warn("Failed to stop provider", providerId, error);
            }
        }
        if (currentPlayingProviderId === providerId) {
            currentPlayingProviderId = null;
        }
        return;
    }
    for (const [id, cached] of clientCache.entries()) {
        if (cached.client) {
            try {
                cached.client.stop();
            } catch (error) {
                console.warn("Failed to stop provider", id, error);
            }
        }
    }
    currentPlayingProviderId = null;
}

function isSpeaking(providerId) {
    if (providerId) {
        const cached = clientCache.get(providerId);
        return !!(cached && cached.client && cached.client.audio && cached.client.audio.isPlaying);
    }
    if (currentPlayingProviderId) {
        return isSpeaking(currentPlayingProviderId);
    }
    for (const cached of clientCache.values()) {
        if (cached.client && cached.client.audio && cached.client.audio.isPlaying) {
            return true;
        }
    }
    return false;
}

export const voiceProviderService = {
    getProviders,
    getProviderDefinition,
    providerRequiresConfig,
    isConfigComplete,
    listVoices,
    speak,
    stop,
    isSpeaking,
    checkCredentials
};


