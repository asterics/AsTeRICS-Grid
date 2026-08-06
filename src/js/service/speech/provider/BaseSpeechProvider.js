import { Voice } from '../Voice.js';

class BaseSpeechProvider {

    voiceChangeHandler = null;

    /**
     * Constructs the BaseProvider and ensures it cannot be instantiated directly.
     */
    constructor() {
        if (this.constructor === BaseSpeechProvider) {
            throw new Error("Cannot instantiate abstract class BaseSpeechProvider directly.");
        }
    }

    // --- Template Methods (MUST be implemented by subclasses) ---

    init() {
        throw new Error(`Method 'init()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    async speak(text, voice, options) {
        throw new Error(`Method 'speak()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    async stop(text, voice) {
        throw new Error(`Method 'stop()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    async isSpeaking(text, voice) {
        throw new Error(`Method 'isSpeaking()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    /**
     * Returns a validated, deduplicated list of Voice objects.
     * Subclasses must implement getVoicesInternal() instead of overriding this.
     * @return {Promise<Voice[]>}
     */
    async getVoices() {
        let voices = await this.getVoicesInternal() || [];
        let seenIds = new Set();
        let result = [];
        for (let voice of voices) {
            if (!(voice instanceof Voice)) {
                log.warn(`${this.constructor.name}.getVoicesInternal() returned a non-Voice object, skipping:`, voice);
                continue;
            }
            if (seenIds.has(voice.id)) {
                continue;
            }
            seenIds.add(voice.id);
            voice._provider = this;
            result.push(voice);
        }
        return result;
    }

    /**
     * Must be implemented by subclasses. Returns an array of Voice objects.
     * @return {Promise<Voice[]>}
     */
    async getVoicesInternal() {
        throw new Error(`Method 'getVoicesInternal()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    /**
     * returns true if the setup is valid, false if not (e.g. some connection credentials or url missing, or Speech API not supported)
     * @return {Promise<boolean>}
     */
    async validateSetup() {
        throw new Error(`Method 'validateSetup()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    // --- Template Methods (CAN be implemented by subclasses) ---

    /**
     * can register a callback to be called if the voices provided by this provider have changed (optional to implement)
     * @param callbackFn
     */
    registerVoiceChangeHandler(callbackFn) {
        this.voiceChangeHandler = callbackFn;
    }

    notifyVoiceUpdate() {
        if (this.voiceChangeHandler) {
            this.voiceChangeHandler(this);
        }
    }
}

export { BaseSpeechProvider };