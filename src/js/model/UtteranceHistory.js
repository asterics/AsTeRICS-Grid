import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { GridElement } from './GridElement.js';
import { GridImage } from './GridImage.js';

class UtteranceHistory extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    utterances: [Model.Array(Object)] // Array of UtteranceEntry objects
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, UtteranceHistory);
        super(properties);
        this.id = this.id || modelUtil.generateId(UtteranceHistory.getIdPrefix());
        this.utterances = this.utterances || [];
    }

    /**
     * Adds a new utterance to the history
     * @param {string} text - The utterance text
     * @param {string} language - Language/locale of the utterance
     * @param {string} sourceContext - Context information (grid ID, element ID, etc.)
     * @param {number} timestamp - When the utterance was spoken (optional, defaults to now)
     * @param {Array} elements - Optional array of GridElement objects that make up this utterance
     */
    addUtterance(text, language, sourceContext, timestamp, elements) {
        if (!text || !text.trim()) {
            return;
        }

        const utteranceEntry = {
            id: modelUtil.generateId('utterance-entry'),
            text: text.trim(),
            language: language || 'en',
            sourceContext: sourceContext || 'unknown',
            timestamp: timestamp || new Date().getTime(),
            frequency: 1, // How many times this exact utterance has been used
            elements: elements ? this._serializeElements(elements) : null // Serialized element structure
        };

        // Check if this exact utterance already exists (compare both text and element structure)
        const existingIndex = this.utterances.findIndex(u =>
            u.text.toLowerCase() === text.toLowerCase().trim() &&
            u.language === language &&
            this._elementsEqual(u.elements, utteranceEntry.elements)
        );

        if (existingIndex !== -1) {
            // Update existing utterance: increment frequency and update timestamp
            this.utterances[existingIndex].frequency++;
            this.utterances[existingIndex].timestamp = utteranceEntry.timestamp;
            this.utterances[existingIndex].sourceContext = sourceContext; // Update to latest context
            // Update elements to latest version (in case images changed)
            if (utteranceEntry.elements) {
                this.utterances[existingIndex].elements = utteranceEntry.elements;
            }
        } else {
            // Add new utterance
            this.utterances.push(utteranceEntry);
        }

        // Sort by timestamp (most recent first)
        this.utterances.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Serializes GridElement objects for storage
     * @param {Array} elements - Array of GridElement objects
     * @returns {Array} Serialized element data
     */
    _serializeElements(elements) {
        if (!elements || !Array.isArray(elements)) {
            return null;
        }

        return elements.map(element => ({
            id: element.id,
            label: element.label,
            image: element.image ? {
                data: element.image.data,
                url: element.image.url,
                author: element.image.author,
                authorURL: element.image.authorURL,
                searchProviderName: element.image.searchProviderName
            } : null,
            type: element.type,
            onlyText: element.onlyText,
            wordFormTags: element.wordFormTags,
            wordFormId: element.wordFormId,
            actions: element.actions ? element.actions.map(action => ({
                modelName: action.modelName,
                // Only store essential action properties to save space
                ...(action.modelName === 'GridActionSpeakCustom' && {
                    speakText: action.speakText,
                    speakLanguage: action.speakLanguage
                }),
                ...(action.modelName === 'GridActionAudio' && {
                    dataBase64: action.dataBase64
                })
            })) : []
        }));
    }

    /**
     * Deserializes element data back to GridElement objects
     * @param {Array} serializedElements - Serialized element data
     * @returns {Array} Array of GridElement objects
     */
    _deserializeElements(serializedElements) {
        if (!serializedElements || !Array.isArray(serializedElements)) {
            return null;
        }

        // GridElement and GridImage are already imported at the top

        return serializedElements.map(elemData => {
            const element = new GridElement({
                id: elemData.id,
                label: elemData.label,
                image: elemData.image ? new GridImage(elemData.image) : null,
                type: elemData.type || GridElement.ELEMENT_TYPE_NORMAL,
                actions: elemData.actions || []
            });

            // Restore additional properties
            if (elemData.onlyText) {
                element.onlyText = elemData.onlyText;
            }
            if (elemData.wordFormTags) {
                element.wordFormTags = elemData.wordFormTags;
            }
            if (elemData.wordFormId) {
                element.wordFormId = elemData.wordFormId;
            }

            return element;
        });
    }

    /**
     * Compares two element structures for equality
     * @param {Array} elements1 - First element structure
     * @param {Array} elements2 - Second element structure
     * @returns {boolean} True if elements are equivalent
     */
    _elementsEqual(elements1, elements2) {
        if (!elements1 && !elements2) return true;
        if (!elements1 || !elements2) return false;
        if (elements1.length !== elements2.length) return false;

        for (let i = 0; i < elements1.length; i++) {
            const e1 = elements1[i];
            const e2 = elements2[i];

            // Compare essential properties
            if (JSON.stringify(e1.label) !== JSON.stringify(e2.label)) return false;
            if (e1.onlyText !== e2.onlyText) return false;

            // Compare image data (URL is sufficient for comparison)
            const img1 = e1.image;
            const img2 = e2.image;
            if ((!img1 && img2) || (img1 && !img2)) return false;
            if (img1 && img2 && img1.url !== img2.url && img1.data !== img2.data) return false;
        }

        return true;
    }

    /**
     * Gets recent utterances, optionally filtered by language
     * @param {number} limit - Maximum number of utterances to return
     * @param {string} language - Optional language filter
     * @param {boolean} deserializeElements - Whether to deserialize element structures
     * @returns {Array} Array of utterance entries
     */
    getRecentUtterances(limit = 10, language = null, deserializeElements = false) {
        let filtered = this.utterances;

        if (language) {
            filtered = this.utterances.filter(u => u.language === language);
        }

        const results = filtered.slice(0, limit);

        if (deserializeElements) {
            return results.map(utterance => ({
                ...utterance,
                elements: this._deserializeElements(utterance.elements)
            }));
        }

        return results;
    }

    /**
     * Gets most frequently used utterances
     * @param {number} limit - Maximum number of utterances to return
     * @param {string} language - Optional language filter
     * @param {boolean} deserializeElements - Whether to deserialize element structures
     * @returns {Array} Array of utterance entries sorted by frequency
     */
    getFrequentUtterances(limit = 10, language = null, deserializeElements = false) {
        let filtered = this.utterances;

        if (language) {
            filtered = this.utterances.filter(u => u.language === language);
        }

        const results = filtered
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit);

        if (deserializeElements) {
            return results.map(utterance => ({
                ...utterance,
                elements: this._deserializeElements(utterance.elements)
            }));
        }

        return results;
    }

    /**
     * Searches utterances by text content
     * @param {string} searchTerm - Text to search for
     * @param {number} limit - Maximum number of results
     * @param {string} language - Optional language filter
     * @param {boolean} deserializeElements - Whether to deserialize element structures
     * @returns {Array} Array of matching utterance entries
     */
    searchUtterances(searchTerm, limit = 10, language = null, deserializeElements = false) {
        if (!searchTerm || !searchTerm.trim()) {
            return [];
        }

        const term = searchTerm.toLowerCase().trim();
        let filtered = this.utterances.filter(u =>
            u.text.toLowerCase().includes(term)
        );

        if (language) {
            filtered = filtered.filter(u => u.language === language);
        }

        const results = filtered
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

        if (deserializeElements) {
            return results.map(utterance => ({
                ...utterance,
                elements: this._deserializeElements(utterance.elements)
            }));
        }

        return results;
    }

    /**
     * Removes old utterances based on retention policy
     * @param {number} maxAge - Maximum age in milliseconds
     * @param {number} maxCount - Maximum number of utterances to keep
     */
    cleanupOldUtterances(maxAge, maxCount) {
        const now = new Date().getTime();
        
        // Remove utterances older than maxAge
        if (maxAge) {
            this.utterances = this.utterances.filter(u => 
                (now - u.timestamp) <= maxAge
            );
        }

        // Keep only the most recent maxCount utterances
        if (maxCount && this.utterances.length > maxCount) {
            this.utterances = this.utterances
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, maxCount);
        }
    }

    /**
     * Gets utterances that could be used for sentence prediction
     * @param {string} currentInput - Current partial input
     * @param {string} language - Language filter
     * @param {number} limit - Maximum suggestions
     * @returns {Array} Array of relevant utterances for prediction
     */
    getPredictionSuggestions(currentInput, language, limit = 5) {
        if (!currentInput || !currentInput.trim()) {
            return this.getFrequentUtterances(limit, language);
        }

        const input = currentInput.toLowerCase().trim();
        
        // Find utterances that start with the current input
        const startsWith = this.utterances.filter(u => 
            u.language === language && 
            u.text.toLowerCase().startsWith(input)
        );

        // Find utterances that contain the input
        const contains = this.utterances.filter(u => 
            u.language === language && 
            u.text.toLowerCase().includes(input) &&
            !u.text.toLowerCase().startsWith(input)
        );

        // Combine and sort by relevance (frequency and recency)
        const combined = [...startsWith, ...contains];
        return combined
            .sort((a, b) => {
                // Prioritize exact starts, then frequency, then recency
                const aStarts = a.text.toLowerCase().startsWith(input) ? 1000 : 0;
                const bStarts = b.text.toLowerCase().startsWith(input) ? 1000 : 0;
                return (bStarts + b.frequency) - (aStarts + a.frequency);
            })
            .slice(0, limit);
    }

    static getModelName() {
        return 'UtteranceHistory';
    }

    static getIdPrefix() {
        return 'utterance-history';
    }
}

UtteranceHistory.defaults({
    id: '', // will be replaced by constructor
    modelName: UtteranceHistory.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    utterances: []
});

export { UtteranceHistory };
