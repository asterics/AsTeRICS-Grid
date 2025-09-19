
import { createBrowserTTSClient } from "js-tts-wrapper/browser";
import { constants } from "../util/constants";

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
    { id: constants.VOICE_PROVIDER_GOOGLE, labelKey: "voiceProviderGoogle", type: "js", engine: "google", requiredConfig: ["keyFilename"] },
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
    const client = createBrowserTTSClient(provider.engine, config || {});
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
    if (!isConfigComplete(provider, config)) {
        return [];
    }
    try {
        const client = await ensureClient(provider, config);
        if (!client) {
            return [];
        }
        return await client.getVoices();
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


