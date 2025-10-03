import { dataService } from './data/dataService.js';
import { localStorageService } from './data/localStorageService.js';
import { i18nService } from './i18nService.js';
import { stateService } from './stateService.js';
import { UtteranceHistory } from '../model/UtteranceHistory.js';
import { log } from '../util/log.js';
import { constants } from '../util/constants.js';
import $ from '../externals/jquery.js';

let utteranceLoggingService = {};

// Private variables
let _utteranceHistory = null;
let _isEnabled = false;
let _maxUtterances = 1000; // Default maximum number of utterances to store
let _maxAge = 30 * 24 * 60 * 60 * 1000; // Default 30 days in milliseconds
let _minUtteranceLength = 2; // Minimum length for utterances to be logged
let _cleanupInterval = null;
let _performanceInterval = null;
let _pendingSave = false;
let _saveTimeout = null;
let _performanceStats = {
    memoryUsageMB: 0,
    lastCleanupTime: 0,
    totalUtterances: 0,
    averageUtteranceLength: 0
};

// Configuration constants
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run cleanup every hour
const SAVE_DEBOUNCE_MS = 5000; // Debounce saves by 5 seconds
const PERFORMANCE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check performance every 5 minutes
const MAX_MEMORY_USAGE_MB = 50; // Maximum memory usage for utterance data
const BATCH_SIZE_CLEANUP = 100; // Process cleanup in batches to avoid blocking
const DEFAULT_SETTINGS = {
    enabled: false,
    maxUtterances: 1000,
    maxAgeDays: 30,
    minUtteranceLength: 2,
    logOnlyManualSpeech: false, // If true, only log when user explicitly speaks
    excludeKeyboardInput: true // If true, don't log single character keyboard inputs
};

/**
 * Initializes the utterance logging service
 * @returns {Promise} Promise that resolves when initialization is complete
 */
utteranceLoggingService.init = async function() {
    log.debug('initializing utterance logging service...');
    
    try {
        // Load user settings
        await loadSettings();
        
        // Load existing utterance history
        await loadUtteranceHistory();
        
        // Set up cleanup interval
        if (_cleanupInterval) {
            clearInterval(_cleanupInterval);
        }
        _cleanupInterval = setInterval(performCleanup, CLEANUP_INTERVAL_MS);

        // Set up performance monitoring
        if (_performanceInterval) {
            clearInterval(_performanceInterval);
        }
        _performanceInterval = setInterval(monitorPerformance, PERFORMANCE_CHECK_INTERVAL_MS);

        // Set up event listeners
        setupEventListeners();

        // Initial performance check
        monitorPerformance();
        
        log.debug('utterance logging service initialized');
        return Promise.resolve();
    } catch (error) {
        log.error('Failed to initialize utterance logging service:', error);
        return Promise.reject(error);
    }
};

/**
 * Logs an utterance to the history
 * @param {string} text - The utterance text
 * @param {Object} options - Additional options
 * @param {string} options.language - Language of the utterance
 * @param {string} options.sourceContext - Source context (grid ID, element ID, etc.)
 * @param {boolean} options.isManualSpeech - Whether this was manually triggered speech
 * @param {number} options.timestamp - Custom timestamp (optional)
 * @param {Array} options.elements - Array of GridElement objects that make up this utterance
 */
utteranceLoggingService.logUtterance = function(text, options = {}) {
    if (!_isEnabled || !text || typeof text !== 'string') {
        return;
    }

    const trimmedText = text.trim();
    
    // Apply filtering rules
    if (trimmedText.length < _minUtteranceLength) {
        return;
    }

    const settings = getSettings();
    
    // Skip if configured to only log manual speech and this isn't manual
    if (settings.logOnlyManualSpeech && !options.isManualSpeech) {
        return;
    }

    // Skip single character inputs if configured to exclude keyboard input
    if (settings.excludeKeyboardInput && trimmedText.length === 1) {
        return;
    }

    // Prepare utterance data
    const language = options.language || i18nService.getContentLang() || 'en';
    const sourceContext = options.sourceContext || getCurrentSourceContext();
    const timestamp = options.timestamp || new Date().getTime();

    try {
        // Add to history
        if (_utteranceHistory) {
            _utteranceHistory.addUtterance(trimmedText, language, sourceContext, timestamp, options.elements);

            // Trigger debounced save
            debouncedSave();

            // Trigger event for other services
            $(document).trigger(constants.EVENT_UTTERANCE_LOGGED, [{
                text: trimmedText,
                language: language,
                sourceContext: sourceContext,
                timestamp: timestamp,
                elements: options.elements
            }]);

            log.debug('Logged utterance:', trimmedText);
        }
    } catch (error) {
        log.error('Failed to log utterance:', error);
    }
};

/**
 * Gets recent utterances for display or prediction
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of utterances
 * @param {string} options.language - Language filter
 * @param {string} options.searchTerm - Search term filter
 * @param {string} options.sortBy - Sort method: 'recent', 'frequent'
 * @param {boolean} options.includeElements - Whether to include deserialized element structures
 * @returns {Array} Array of utterance entries
 */
utteranceLoggingService.getUtterances = function(options = {}) {
    if (!_utteranceHistory) {
        return [];
    }

    const {
        limit = 10,
        language = null,
        searchTerm = null,
        sortBy = 'recent',
        includeElements = false
    } = options;

    try {
        if (searchTerm) {
            return _utteranceHistory.searchUtterances(searchTerm, limit, language, includeElements);
        } else if (sortBy === 'frequent') {
            return _utteranceHistory.getFrequentUtterances(limit, language, includeElements);
        } else {
            return _utteranceHistory.getRecentUtterances(limit, language, includeElements);
        }
    } catch (error) {
        log.error('Failed to get utterances:', error);
        return [];
    }
};

/**
 * Gets utterance suggestions for prediction
 * @param {string} currentInput - Current partial input
 * @param {string} language - Language filter
 * @param {number} limit - Maximum suggestions
 * @returns {Array} Array of suggestion objects
 */
utteranceLoggingService.getPredictionSuggestions = function(currentInput, language, limit = 5) {
    if (!_isEnabled || !_utteranceHistory) {
        return [];
    }

    try {
        const suggestions = _utteranceHistory.getPredictionSuggestions(currentInput, language, limit);
        return suggestions.map(utterance => ({
            text: utterance.text,
            frequency: utterance.frequency,
            lastUsed: utterance.timestamp,
            source: 'utterance-history'
        }));
    } catch (error) {
        log.error('Failed to get prediction suggestions:', error);
        return [];
    }
};

/**
 * Updates service settings
 * @param {Object} newSettings - New settings to apply
 */
utteranceLoggingService.updateSettings = function(newSettings) {
    const currentSettings = getSettings();
    const updatedSettings = Object.assign({}, currentSettings, newSettings);
    
    // Update internal state
    _isEnabled = updatedSettings.enabled;
    _maxUtterances = updatedSettings.maxUtterances;
    _maxAge = updatedSettings.maxAgeDays * 24 * 60 * 60 * 1000;
    _minUtteranceLength = updatedSettings.minUtteranceLength;
    
    // Save to local storage
    localStorageService.saveUserSettings({
        utteranceLogging: updatedSettings
    });
    
    // Perform cleanup with new settings
    if (_utteranceHistory) {
        performCleanup();
    }
    
    log.debug('Updated utterance logging settings:', updatedSettings);
};

/**
 * Gets current service settings
 * @returns {Object} Current settings
 */
utteranceLoggingService.getSettings = function() {
    return getSettings();
};

/**
 * Checks if utterance logging is enabled
 * @returns {boolean} True if enabled
 */
utteranceLoggingService.isEnabled = function() {
    return _isEnabled;
};

/**
 * Manually triggers a save of the utterance history
 * @returns {Promise} Promise that resolves when save is complete
 */
utteranceLoggingService.save = function() {
    return saveUtteranceHistory();
};

/**
 * Gets current performance statistics
 * @returns {Object} Performance statistics
 */
utteranceLoggingService.getPerformanceStats = function() {
    return Object.assign({}, _performanceStats);
};

/**
 * Clears all utterance history
 * @returns {Promise} Promise that resolves when clear is complete
 */
utteranceLoggingService.clearHistory = async function() {
    if (_utteranceHistory) {
        _utteranceHistory.utterances = [];
        await saveUtteranceHistory();
        log.debug('Cleared utterance history');
    }
};

// Private helper functions

async function loadSettings() {
    const userSettings = localStorageService.getUserSettings();
    const settings = Object.assign({}, DEFAULT_SETTINGS, userSettings.utteranceLogging || {});
    
    _isEnabled = settings.enabled;
    _maxUtterances = settings.maxUtterances;
    _maxAge = settings.maxAgeDays * 24 * 60 * 60 * 1000;
    _minUtteranceLength = settings.minUtteranceLength;
}

function getSettings() {
    const userSettings = localStorageService.getUserSettings();
    return Object.assign({}, DEFAULT_SETTINGS, userSettings.utteranceLogging || {});
}

async function loadUtteranceHistory() {
    try {
        const histories = await dataService.getUtteranceHistories();
        if (histories && histories.length > 0) {
            _utteranceHistory = histories[0];
        } else {
            _utteranceHistory = new UtteranceHistory();
        }
    } catch (error) {
        log.warn('Failed to load utterance history, creating new one:', error);
        _utteranceHistory = new UtteranceHistory();
    }
}

async function saveUtteranceHistory() {
    if (!_utteranceHistory || _pendingSave) {
        return;
    }

    _pendingSave = true;
    try {
        await dataService.saveUtteranceHistory(_utteranceHistory);
        log.debug('Saved utterance history');
    } catch (error) {
        log.error('Failed to save utterance history:', error);
    } finally {
        _pendingSave = false;
    }
}

function debouncedSave() {
    if (_saveTimeout) {
        clearTimeout(_saveTimeout);
    }
    _saveTimeout = setTimeout(() => {
        saveUtteranceHistory();
    }, SAVE_DEBOUNCE_MS);
}

function performCleanup() {
    if (_utteranceHistory && _isEnabled) {
        const beforeCount = _utteranceHistory.utterances.length;

        // Perform cleanup in batches to avoid blocking the UI
        performBatchCleanup();

        const afterCount = _utteranceHistory.utterances.length;

        if (beforeCount !== afterCount) {
            log.debug(`Cleaned up utterance history: ${beforeCount} -> ${afterCount} utterances`);
            debouncedSave();
        }

        _performanceStats.lastCleanupTime = new Date().getTime();
    }
}

function performBatchCleanup() {
    if (!_utteranceHistory) return;

    const now = new Date().getTime();
    let processedCount = 0;

    // Remove old utterances in batches
    const originalLength = _utteranceHistory.utterances.length;

    // First pass: remove by age
    if (_maxAge) {
        _utteranceHistory.utterances = _utteranceHistory.utterances.filter(u => {
            processedCount++;
            if (processedCount % BATCH_SIZE_CLEANUP === 0) {
                // Yield control to prevent blocking
                setTimeout(() => {}, 0);
            }
            return (now - u.timestamp) <= _maxAge;
        });
    }

    // Second pass: limit by count
    if (_maxUtterances && _utteranceHistory.utterances.length > _maxUtterances) {
        _utteranceHistory.utterances = _utteranceHistory.utterances
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, _maxUtterances);
    }

    // Update performance stats
    updatePerformanceStats();
}

function monitorPerformance() {
    if (!_utteranceHistory) return;

    try {
        // Calculate memory usage estimate
        const utteranceData = JSON.stringify(_utteranceHistory.utterances);
        const memorySizeBytes = new Blob([utteranceData]).size;
        const memorySizeMB = memorySizeBytes / (1024 * 1024);

        _performanceStats.memoryUsageMB = memorySizeMB;
        _performanceStats.totalUtterances = _utteranceHistory.utterances.length;

        // Calculate average utterance length
        if (_utteranceHistory.utterances.length > 0) {
            const totalLength = _utteranceHistory.utterances.reduce((sum, u) => sum + u.text.length, 0);
            _performanceStats.averageUtteranceLength = totalLength / _utteranceHistory.utterances.length;
        }

        // Trigger aggressive cleanup if memory usage is too high
        if (memorySizeMB > MAX_MEMORY_USAGE_MB) {
            log.warn(`Utterance history memory usage (${memorySizeMB.toFixed(2)}MB) exceeds limit (${MAX_MEMORY_USAGE_MB}MB). Performing aggressive cleanup.`);
            performAggressiveCleanup();
        }

        log.debug(`Utterance history performance: ${memorySizeMB.toFixed(2)}MB, ${_performanceStats.totalUtterances} utterances`);
    } catch (error) {
        log.error('Error monitoring utterance history performance:', error);
    }
}

function performAggressiveCleanup() {
    if (!_utteranceHistory) return;

    const originalCount = _utteranceHistory.utterances.length;

    // Reduce to 70% of max utterances
    const targetCount = Math.floor(_maxUtterances * 0.7);

    // Keep only the most recent and most frequent utterances
    const recentUtterances = _utteranceHistory.utterances
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, Math.floor(targetCount * 0.7));

    const frequentUtterances = _utteranceHistory.utterances
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, Math.floor(targetCount * 0.3))
        .filter(u => !recentUtterances.find(r => r.id === u.id));

    _utteranceHistory.utterances = [...recentUtterances, ...frequentUtterances];

    log.warn(`Aggressive cleanup: reduced utterances from ${originalCount} to ${_utteranceHistory.utterances.length}`);

    debouncedSave();
    updatePerformanceStats();
}

function updatePerformanceStats() {
    if (!_utteranceHistory) return;

    _performanceStats.totalUtterances = _utteranceHistory.utterances.length;

    if (_utteranceHistory.utterances.length > 0) {
        const totalLength = _utteranceHistory.utterances.reduce((sum, u) => sum + u.text.length, 0);
        _performanceStats.averageUtteranceLength = totalLength / _utteranceHistory.utterances.length;
    } else {
        _performanceStats.averageUtteranceLength = 0;
    }
}

function getCurrentSourceContext() {
    try {
        const currentGrid = stateService.getCurrentGrid();
        return currentGrid ? `grid:${currentGrid.id}` : 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

function setupEventListeners() {
    // Clean up existing listeners
    $(document).off('.utteranceLogging');

    // Listen for speaking events
    $(document).on(constants.EVENT_SPEAKING_TEXT + '.utteranceLogging', function(event, text, options) {
        utteranceLoggingService.logUtterance(text, {
            isManualSpeech: true,
            ...options
        });
    });
}

// Initialize service when user changes
$(document).on(constants.EVENT_USER_CHANGED, () => {
    utteranceLoggingService.init().catch(error => {
        log.error('Failed to initialize utterance logging service after user change:', error);
    });
});

// Clean up when user is changing
$(document).on(constants.EVENT_USER_CHANGING, () => {
    if (_cleanupInterval) {
        clearInterval(_cleanupInterval);
        _cleanupInterval = null;
    }
    if (_performanceInterval) {
        clearInterval(_performanceInterval);
        _performanceInterval = null;
    }
    if (_saveTimeout) {
        clearTimeout(_saveTimeout);
        _saveTimeout = null;
    }
});

export { utteranceLoggingService };
