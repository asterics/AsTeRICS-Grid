import { utteranceLoggingService } from './utteranceLoggingService.js';
import { speechService } from './speechService.js';
import { collectElementService } from './collectElementService.js';
import { GridActionMessageHistory } from '../model/GridActionMessageHistory.js';
import { GridElement } from '../model/GridElement.js';
import { log } from '../util/log.js';
import { constants } from '../util/constants.js';
import $ from '../externals/jquery.js';

let messageHistoryService = {};

// Private variables
let registeredMessageHistoryElements = [];

/**
 * Registers message history elements for updates
 * @param {Array} elements - Array of grid elements
 */
messageHistoryService.initWithElements = function(elements) {
    registeredMessageHistoryElements = [];
    
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_MESSAGE_HISTORY) {
            registeredMessageHistoryElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
    
    log.debug(`Registered ${registeredMessageHistoryElements.length} message history elements`);
};

/**
 * Performs a message history action
 * @param {Object} action - GridActionMessageHistory instance
 * @param {Object} gridElement - The grid element that triggered the action
 */
messageHistoryService.doAction = function(action, gridElement) {
    if (!action || action.modelName !== GridActionMessageHistory.getModelName()) {
        return;
    }

    switch (action.action) {
        case GridActionMessageHistory.ACTION_SHOW_RECENT:
            updateMessageHistoryElements('recent', action);
            break;
        case GridActionMessageHistory.ACTION_SHOW_FREQUENT:
            updateMessageHistoryElements('frequent', action);
            break;
        case GridActionMessageHistory.ACTION_SEARCH:
            if (action.searchTerm) {
                searchMessageHistory(action.searchTerm, action);
            }
            break;
        case GridActionMessageHistory.ACTION_CLEAR_HISTORY:
            clearMessageHistory();
            break;
        default:
            log.warn('Unknown message history action:', action.action);
    }
};

/**
 * Gets utterances for display in message history elements
 * @param {Object} options - Query options
 * @returns {Array} Array of utterance objects
 */
messageHistoryService.getUtterances = function(options = {}) {
    if (!utteranceLoggingService.isEnabled()) {
        return [];
    }

    // Always include elements for message history
    return utteranceLoggingService.getUtterances({
        ...options,
        includeElements: true
    });
};

/**
 * Selects an utterance (speaks it or adds to collect element)
 * @param {Object} utterance - The utterance object
 * @param {Object} options - Additional options
 */
messageHistoryService.selectUtterance = function(utterance, options = {}) {
    if (!utterance || !utterance.text) {
        return;
    }

    const text = utterance.text;

    // Check if we should add to collect element or speak directly
    if (options.addToCollect !== false && collectElementService.hasRegisteredCollectElements()) {
        // If we have the original elements, reconstruct them in the collect element
        if (utterance.elements && Array.isArray(utterance.elements)) {
            // Clear current collect elements and add the historical ones
            collectElementService.clearAll();

            // Add each element from the utterance history
            utterance.elements.forEach(element => {
                // Reconstruct the element and add it to collected elements
                collectElementService.addElementToCollected(element);
            });

            log.debug('Reconstructed utterance elements in collect element:', utterance.elements.length, 'elements');
        } else {
            // Fallback to just adding the text
            collectElementService.addText(text);
            log.debug('Added utterance text to collect element:', text);
        }
    } else {
        // Speak directly with original elements if available
        speechService.speak(text, {
            sourceContext: 'message-history',
            language: utterance.language,
            elements: utterance.elements
        });
        log.debug('Speaking utterance from history:', text);
    }
};

/**
 * Clears all message history
 */
messageHistoryService.clearHistory = function() {
    return utteranceLoggingService.clearHistory().then(() => {
        // Trigger update of all message history elements
        $(document).trigger(constants.EVENT_MESSAGE_HISTORY_UPDATED);
        log.debug('Message history cleared');
    });
};

/**
 * Checks if message history logging is enabled
 * @returns {boolean} True if enabled
 */
messageHistoryService.isEnabled = function() {
    return utteranceLoggingService.isEnabled();
};

/**
 * Gets the current settings for message history
 * @returns {Object} Settings object
 */
messageHistoryService.getSettings = function() {
    return utteranceLoggingService.getSettings();
};

/**
 * Updates settings for message history
 * @param {Object} newSettings - New settings to apply
 */
messageHistoryService.updateSettings = function(newSettings) {
    utteranceLoggingService.updateSettings(newSettings);
};

// Private helper functions

function updateMessageHistoryElements(sortBy, action) {
    const options = {
        limit: action.maxItems || 10,
        language: action.language || null,
        sortBy: sortBy
    };

    const utterances = utteranceLoggingService.getUtterances(options);
    
    // Trigger update event for Vue components
    $(document).trigger(constants.EVENT_MESSAGE_HISTORY_UPDATED, [{
        utterances: utterances,
        sortBy: sortBy,
        action: action
    }]);
}

function searchMessageHistory(searchTerm, action) {
    const options = {
        limit: action.maxItems || 10,
        language: action.language || null,
        searchTerm: searchTerm
    };

    const utterances = utteranceLoggingService.getUtterances(options);
    
    // Trigger update event for Vue components
    $(document).trigger(constants.EVENT_MESSAGE_HISTORY_UPDATED, [{
        utterances: utterances,
        searchTerm: searchTerm,
        action: action
    }]);
}

function clearMessageHistory() {
    messageHistoryService.clearHistory();
}

// Set up event listeners
$(document).on(constants.EVENT_UTTERANCE_LOGGED, function() {
    // Update all message history elements when new utterance is logged
    $(document).trigger(constants.EVENT_MESSAGE_HISTORY_UPDATED);
});

export { messageHistoryService };
