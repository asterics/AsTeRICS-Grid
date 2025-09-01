import { constants } from '../util/constants';
import { MetaData } from '../model/MetaData';
import { dataService } from './data/dataService';
import { i18nService } from './i18nService';

let customColorSchemeService = {};

/**
 * Creates a new custom color scheme
 * @param {string} name - Display name for the custom scheme
 * @param {string} baseScheme - Base scheme type ('FITZGERALD', 'GOOSENS', 'MONTESSORI')
 * @param {Array} colors - Array of hex color strings
 * @param {Object} metadata - Current metadata object
 * @returns {Object} The created custom color scheme
 */
customColorSchemeService.createCustomScheme = function(name, baseScheme = 'FITZGERALD', colors = null, metadata = null) {
    if (!name || name.trim() === '') {
        throw new Error(i18nService.t('customSchemeNameRequired'));
    }
    
    let customScheme = constants.createCustomColorScheme(name.trim(), baseScheme);
    
    if (colors && Array.isArray(colors) && colors.length > 0) {
        customScheme.colors = colors;
    }
    
    // Validate colors
    if (!customColorSchemeService.validateColorScheme(customScheme)) {
        throw new Error(i18nService.t('invalidColorScheme'));
    }
    
    return customScheme;
};

/**
 * Validates a color scheme object
 * @param {Object} scheme - Color scheme to validate
 * @returns {boolean} True if valid
 */
customColorSchemeService.validateColorScheme = function(scheme) {
    if (!scheme || typeof scheme !== 'object') {
        return false;
    }
    
    // Check required properties
    if (!scheme.name || !scheme.displayName || !scheme.categories || !scheme.colors) {
        return false;
    }
    
    // Check that colors array matches categories length
    if (!Array.isArray(scheme.colors) || !Array.isArray(scheme.categories)) {
        return false;
    }
    
    if (scheme.colors.length !== scheme.categories.length) {
        return false;
    }
    
    // Validate hex colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (let color of scheme.colors) {
        if (!hexColorRegex.test(color)) {
            return false;
        }
    }
    
    return true;
};

/**
 * Saves a custom color scheme to metadata and persists it
 * @param {Object} customScheme - The custom color scheme to save
 * @param {Object} metadata - Current metadata object
 * @returns {Promise} Promise that resolves when saved
 */
customColorSchemeService.saveCustomScheme = async function(customScheme, metadata) {
    if (!customColorSchemeService.validateColorScheme(customScheme)) {
        throw new Error(i18nService.t('invalidColorScheme'));
    }
    
    // Check if updating existing scheme
    let existingIndex = -1;
    if (metadata.colorConfig.additionalColorSchemes) {
        existingIndex = metadata.colorConfig.additionalColorSchemes.findIndex(
            scheme => scheme.name === customScheme.name
        );
    }
    
    if (existingIndex !== -1) {
        // Update existing
        MetaData.updateCustomColorScheme(metadata, customScheme);
    } else {
        // Add new
        MetaData.addCustomColorScheme(metadata, customScheme);
    }
    
    // Save metadata to database
    await dataService.saveMetadata(metadata);
    
    return customScheme;
};

/**
 * Deletes a custom color scheme
 * @param {string} schemeName - Name of the scheme to delete
 * @param {Object} metadata - Current metadata object
 * @returns {Promise} Promise that resolves when deleted
 */
customColorSchemeService.deleteCustomScheme = async function(schemeName, metadata) {
    if (!schemeName || !schemeName.startsWith(constants.COLOR_SCHEME_CUSTOM_PREFIX)) {
        throw new Error(i18nService.t('cannotDeletePredefinedScheme'));
    }
    
    let deleted = MetaData.deleteCustomColorScheme(metadata, schemeName);
    
    if (!deleted) {
        throw new Error(i18nService.t('customSchemeNotFound'));
    }
    
    // Save metadata to database
    await dataService.saveMetadata(metadata);
    
    return true;
};

/**
 * Gets all available color schemes (default + custom)
 * @param {Object} metadata - Current metadata object
 * @returns {Array} Array of all color schemes
 */
customColorSchemeService.getAllSchemes = function(metadata) {
    return MetaData.getAllColorSchemes(metadata);
};

/**
 * Gets only custom color schemes
 * @param {Object} metadata - Current metadata object
 * @returns {Array} Array of custom color schemes
 */
customColorSchemeService.getCustomSchemes = function(metadata) {
    if (!metadata || !metadata.colorConfig.additionalColorSchemes) {
        return [];
    }
    return metadata.colorConfig.additionalColorSchemes;
};

/**
 * Checks if a scheme name is available
 * @param {string} name - Name to check
 * @param {Object} metadata - Current metadata object
 * @returns {boolean} True if name is available
 */
customColorSchemeService.isNameAvailable = function(name, metadata) {
    if (!name || name.trim() === '') {
        return false;
    }
    
    let schemeName = constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' + name.toUpperCase().replace(/\s+/g, '_');
    let allSchemes = MetaData.getAllColorSchemes(metadata);
    
    return !allSchemes.some(scheme => scheme.name === schemeName);
};

/**
 * Duplicates an existing color scheme as a custom scheme
 * @param {string} sourceSchemeId - ID of the scheme to duplicate
 * @param {string} newName - Name for the new custom scheme
 * @param {Object} metadata - Current metadata object
 * @returns {Object} The duplicated custom color scheme
 */
customColorSchemeService.duplicateScheme = function(sourceSchemeId, newName, metadata) {
    let allSchemes = MetaData.getAllColorSchemes(metadata);
    let sourceScheme = allSchemes.find(scheme => scheme.name === sourceSchemeId);
    
    if (!sourceScheme) {
        throw new Error(i18nService.t('sourceSchemeNotFound'));
    }
    
    let customScheme = {
        name: constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' + newName.toUpperCase().replace(/\s+/g, '_'),
        displayName: newName,
        categories: [...sourceScheme.categories],
        colors: [...sourceScheme.colors],
        isCustom: true
    };
    
    if (sourceScheme.mappings) {
        customScheme.mappings = { ...sourceScheme.mappings };
    }
    
    if (sourceScheme.customBorders) {
        customScheme.customBorders = { ...sourceScheme.customBorders };
    }
    
    return customScheme;
};

export { customColorSchemeService };
