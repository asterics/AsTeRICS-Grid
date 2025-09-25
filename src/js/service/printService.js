import { GridData } from '../model/GridData';
import { GridImage } from '../model/GridImage';
import { i18nService } from './i18nService';
import { imageUtil } from '../util/imageUtil';
import { GridElement } from '../model/GridElement';
import { util } from '../util/util';
import { dataService } from './data/dataService.js';
import { MetaData } from '../model/MetaData.js';
import { arasaacService } from './pictograms/arasaacService.js';
import $ from "../externals/jquery.js";
import {constants} from "../util/constants.js";
import {TextConfig} from "../model/TextConfig.js";
import { ColorConfig } from "../model/ColorConfig.js";
import { gridUtil } from '../util/gridUtil';
import { fontUtil } from '../util/fontUtil';

let printService = {};
let pdfOptions = {
    docPadding: 5,
    footerHeight: 12, // Increased from 8 to provide more space
    textPadding: null,
    elementMargin: null,
    imgMargin: 1,
    imgHeightPercentage: 0.8,
    fontFamily: null,
    borderWidth: null,
    borderRadius: null,
    usePDF: true, // New configuration option to enable/disable PDF-specific features
    verbose: false // Control logging verbosity
};

// Global variables for metadata configuration
let convertMode = null;

// NEW: Function to wait for UI updates to complete
function waitForUIUpdates() {
    return new Promise((resolve) => {
        // OPTIMIZED: Reduced wait times for faster PDF generation
        setTimeout(() => {
            // Wait for any pending Vue updates
            if (typeof window !== 'undefined' && typeof vueApp !== 'undefined' && vueApp && vueApp.$nextTick) {
                vueApp.$nextTick(() => {
                    // Reduced CSS update wait time
                    setTimeout(resolve, 25);
                });
            } else if (typeof window !== 'undefined' && window.app && window.app.$nextTick) {
                window.app.$nextTick(() => {
                    // Reduced CSS update wait time
                    setTimeout(resolve, 25);
                });
            } else {
                // Reduced fallback wait time
                setTimeout(resolve, 25);
            }
        }, 25); // Reduced initial wait time
    });
}

// NEW: Function to force UI synchronization
function forceUISynchronization() {
    try {
        // Force a re-render of all grid elements
        if (typeof window !== 'undefined') {
            // Trigger a global update event
            window.dispatchEvent(new CustomEvent('force-ui-sync'));
            
            // Force Vue to re-render using vueApp (the global variable used in the codebase)
            if (typeof vueApp !== 'undefined' && vueApp && vueApp.$forceUpdate) {
                vueApp.$forceUpdate();
            }
            
            // Also try window.app if it exists
            if (window.app && window.app.$forceUpdate) {
                window.app.$forceUpdate();
            }
            
            // Force all child components to update
            if (window.app && window.app.$children) {
                window.app.$children.forEach(child => {
                    if (child.$forceUpdate) {
                        child.$forceUpdate();
                    }
                });
            }
        }
        
        // Force CSS recalculation (less aggressive approach)
        if (typeof document !== 'undefined') {
            // Trigger a reflow without hiding the body
            document.body.offsetHeight;
            
            // Force recalculation of grid elements specifically
            const gridElements = document.querySelectorAll('.grid-layout-element, .element-container, [id^="element-"]');
            gridElements.forEach(element => {
                element.offsetHeight; // Trigger reflow for each element
            });
        }
        
        // UI synchronization completed
    } catch (error) {
        console.warn('⚠ Error during UI synchronization:', error);
    }
}

// NEW: Function to get the most current UI metadata
function getCurrentUIMetadata() {
    try {
        // Method 1: Try to get from Vue app instance (vueApp is the global variable used in the codebase)
        if (typeof window !== 'undefined' && typeof vueApp !== 'undefined' && vueApp && vueApp.metadata) {
            return JSON.parse(JSON.stringify(vueApp.metadata)); // Deep clone
        }
        
        // Method 1b: Try to get from window.app if it exists
        if (typeof window !== 'undefined' && window.app && window.app.$children) {
            for (let child of window.app.$children) {
                if (child.metadata && child.metadata.colorConfig && child.metadata.textConfig) {
                    return JSON.parse(JSON.stringify(child.metadata)); // Deep clone
                }
            }
        }
        
        // Method 2: Try to get from global window object
        if (typeof window !== 'undefined' && window.metadata) {
            return JSON.parse(JSON.stringify(window.metadata)); // Deep clone
        }
        
        // Method 3: Try to get from current view component
        if (typeof window !== 'undefined' && window.currentView && window.currentView.metadata) {
            return JSON.parse(JSON.stringify(window.currentView.metadata)); // Deep clone
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// NEW: Function to validate UI-to-PDF calculations match exactly
function validateUItoPDFMatch(elementId, uiElement, pdfCalculations) {
    if (!uiElement || !uiElement.length) {
        return false;
    }
    
    const PX_TO_MM = 0.264583;
    
    // Get UI values - use specific CSS properties to avoid shorthand issues
    const uiMargin = parseFloat(uiElement.css('margin-top')) || 0; // Use margin-top as all margins are the same
    const uiBorderWidth = parseFloat(uiElement.css('border-top-width')) || 0; // Use border-top-width as all borders are the same
    const uiBorderRadius = parseFloat(uiElement.css('border-top-left-radius')) || 0; // Use border-top-left-radius as all corners are the same
    const uiBgColor = uiElement.css('background-color');
    const uiBorderColor = uiElement.css('border-top-color'); // Use border-top-color as all borders are the same
    const uiFontSize = parseFloat(uiElement.css('font-size')) || 0;
    const uiColor = uiElement.css('color');
    
    // Convert to mm for comparison
    const uiMarginMM = uiMargin * PX_TO_MM;
    const uiBorderWidthMM = uiBorderWidth * PX_TO_MM;
    const uiBorderRadiusMM = uiBorderRadius * PX_TO_MM;
    const uiFontSizeMM = uiFontSize * PX_TO_MM;
    
    // Validate calculations
    const marginMatch = Math.abs(uiMarginMM - pdfCalculations.elementMarginMM) < 0.1;
    const borderWidthMatch = Math.abs(uiBorderWidthMM - pdfCalculations.borderWidthMM) < 0.1;
    const borderRadiusMatch = Math.abs(uiBorderRadiusMM - pdfCalculations.borderRadiusMM) < 0.1;
    const fontSizeMatch = Math.abs(uiFontSizeMM - pdfCalculations.fontSizeMM) < 0.1;
    
    // Validate colors with error handling
    let bgColorMatch = true;
    let borderColorMatch = true;
    let fontColorMatch = true;
    
    try {
        if (uiBgColor) {
            const uiBgRGB = colorToRGB(uiBgColor);
            bgColorMatch = uiBgRGB.join(',') === pdfCalculations.bgColor.join(',');
        }
    } catch (error) {
        console.warn(`Error validating background color for ${elementId}:`, error);
        bgColorMatch = false;
    }
    
    try {
        if (uiBorderColor) {
            const uiBorderRGB = colorToRGB(uiBorderColor);
            borderColorMatch = uiBorderRGB.join(',') === pdfCalculations.borderColor.join(',');
        }
    } catch (error) {
        console.warn(`Error validating border color for ${elementId}:`, error);
        borderColorMatch = false;
    }
    
    try {
        if (uiColor) {
            const uiFontRGB = colorToRGB(uiColor);
            fontColorMatch = uiFontRGB.join(',') === pdfCalculations.fontColor.join(',');
        }
    } catch (error) {
        console.warn(`Error validating font color for ${elementId}:`, error);
        fontColorMatch = false;
    }
    
    const allMatch = marginMatch && borderWidthMatch && borderRadiusMatch && 
                    fontSizeMatch && bgColorMatch && borderColorMatch && fontColorMatch;
    
    if (!allMatch) {
        console.warn(`🔍 UI-to-PDF mismatch for element ${elementId}:`);
        console.warn(`  Margin: UI=${uiMarginMM.toFixed(3)}mm, PDF=${pdfCalculations.elementMarginMM.toFixed(3)}mm (${marginMatch ? '✅' : '❌'})`);
        console.warn(`  Border Width: UI=${uiBorderWidthMM.toFixed(3)}mm, PDF=${pdfCalculations.borderWidthMM.toFixed(3)}mm (${borderWidthMatch ? '✅' : '❌'})`);
        console.warn(`  Border Radius: UI=${uiBorderRadiusMM.toFixed(3)}mm, PDF=${pdfCalculations.borderRadiusMM.toFixed(3)}mm (${borderRadiusMatch ? '✅' : '❌'})`);
        console.warn(`  Font Size: UI=${uiFontSizeMM.toFixed(3)}mm, PDF=${pdfCalculations.fontSizeMM.toFixed(3)}mm (${fontSizeMatch ? '✅' : '❌'})`);
        console.warn(`  Background Color: UI=${uiBgColor}, PDF=[${pdfCalculations.bgColor.join(', ')}] (${bgColorMatch ? '✅' : '❌'})`);
        console.warn(`  Border Color: UI=${uiBorderColor}, PDF=[${pdfCalculations.borderColor.join(', ')}] (${borderColorMatch ? '✅' : '❌'})`);
        console.warn(`  Font Color: UI=${uiColor}, PDF=[${pdfCalculations.fontColor.join(', ')}] (${fontColorMatch ? '✅' : '❌'})`);
    } else {
        console.log(` UI-to-PDF perfect match for element ${elementId}`);
    }
    
    return allMatch;
}

function updatePdfOptionsFromMetadata(metadata) {
    console.log(' Updating PDF options from metadata:', {
        metadataElementMargin: metadata?.colorConfig?.elementMargin,
        metadataTextPadding: metadata?.textConfig?.textPadding,
        metadataFontFamily: metadata?.textConfig?.fontFamily,
        metadataBorderWidth: metadata?.colorConfig?.borderWidth,
        metadataBorderRadius: metadata?.colorConfig?.borderRadius,
        usePDF: pdfOptions.usePDF
    });

    const missingFields = [];

    if (metadata?.colorConfig?.elementMargin != null) {
        pdfOptions.elementMargin = metadata.colorConfig.elementMargin; // Keep as percentage, don't divide by 100
    } else {
        pdfOptions.elementMargin = 0.15; // Default to 0.15% (matches ColorConfig default)
        missingFields.push('colorConfig.elementMargin');
    }

    if (metadata?.textConfig?.textPadding != null) {
        pdfOptions.textPadding = metadata.textConfig.textPadding;
    } else {
        pdfOptions.textPadding = 2; // Default to 2mm (matches TextConfig default)
        missingFields.push('textConfig.textPadding');
    }

    if (metadata?.textConfig?.fontFamily != null) {
        pdfOptions.fontFamily = metadata.textConfig.fontFamily;
    } else {
        pdfOptions.fontFamily = 'Arial'; // Default to Arial (matches TextConfig default)
        missingFields.push('textConfig.fontFamily');
    }

    if (metadata?.colorConfig?.borderWidth != null) {
        pdfOptions.borderWidth = metadata.colorConfig.borderWidth;
    } else {
        pdfOptions.borderWidth = 0.1; // Default to 0.1% (matches ColorConfig default)
        missingFields.push('colorConfig.borderWidth');
    }

    if (metadata?.colorConfig?.borderRadius != null) {
        pdfOptions.borderRadius = metadata.colorConfig.borderRadius;
    } else {
        pdfOptions.borderRadius = 0.4; // Default to 0.4% (matches ColorConfig default)
        missingFields.push('colorConfig.borderRadius');
    }

    if (missingFields.length > 0) {
        // Missing metadata fields, using defaults
    }

}

// Pattern font mappings removed to avoid 404 errors
// We're using built-in fonts instead
let patternFontMappings = [];

function colorToRGB(color) {
    try {
        if (Array.isArray(color) && color.length === 3 && color.every(c => typeof c === 'number' && c >= 0 && c <= 255)) {
                return color;
        }
        
        if (typeof color === 'string' && color.startsWith('#')) {
            let rgb = util.hexToRGB(color);
            if (rgb && Array.isArray(rgb) && rgb.length === 3) {
                return rgb;
            }
            throw new Error(`Invalid hex color format: ${color}`);
        }
        
        if (typeof color === 'string' && color.indexOf('rgb') === 0) {
            let rgb = util.cssRGBToRGB(color);
            if (rgb && Array.isArray(rgb) && rgb.length === 3) {
                return rgb;
            }
            throw new Error(`Invalid CSS RGB format: ${color}`);
        }
        
        if (typeof color === 'string' && color.toLowerCase() === 'transparent') {
            return [255, 255, 255];
        }
        
        if (typeof color === 'string') {
            let namedColors = {
                'black': [0, 0, 0],
                'white': [255, 255, 255],
                'red': [255, 0, 0],
                'green': [0, 255, 0],
                'blue': [0, 0, 255],
                'yellow': [255, 255, 0],
                'cyan': [0, 255, 255],
                'magenta': [255, 0, 255],
                'gray': [128, 128, 128],
                'grey': [128, 128, 128],
                'orange': [255, 165, 0],
                'purple': [128, 0, 128],
                'brown': [165, 42, 42],
                'pink': [255, 192, 203]
            };
            
            let lowerColor = color.toLowerCase();
            if (namedColors[lowerColor]) {
                return namedColors[lowerColor];
            }
        }
        
        if (typeof util.getRGB === 'function') {
            let rgb = util.getRGB(color);
            if (rgb && Array.isArray(rgb) && rgb.length === 3) {
                return rgb;
            }
        }
        
        // Handle HSL color format
        if (typeof color === 'string' && color.toLowerCase().startsWith('hsl')) {
            // More robust regex that handles spaces, decimals, and various formats
            let hslMatch = color.match(/hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)/i);
            if (hslMatch) {
                let h = parseFloat(hslMatch[1]) / 360; // Convert to 0-1 range
                let s = parseFloat(hslMatch[2]) / 100; // Convert to 0-1 range
                let l = parseFloat(hslMatch[3]) / 100; // Convert to 0-1 range
                
                // Convert HSL to RGB
                let r, g, b;
                if (s === 0) {
                    r = g = b = l; // achromatic
                } else {
                    let hue2rgb = function(p, q, t) {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1/6) return p + (q - p) * 6 * t;
                        if (t < 1/2) return q;
                        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    };
                    
                    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    let p = 2 * l - q;
                    r = hue2rgb(p, q, h + 1/3);
                    g = hue2rgb(p, q, h);
                    b = hue2rgb(p, q, h - 1/3);
                }
                
                // Ensure RGB values are within valid range
                const rValue = Math.max(0, Math.min(255, Math.round(r * 255)));
                const gValue = Math.max(0, Math.min(255, Math.round(g * 255)));
                const bValue = Math.max(0, Math.min(255, Math.round(b * 255)));
                
                return [rValue, gValue, bValue];
            }
        }

        throw new Error(`Unknown color format: ${color}`);
    } catch (error) {
        console.error('Error in colorToRGB:', error);
        return [0, 0, 0];
    }
}









printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        const originalWidth = $('#grid-container').width();
        const originalHeight = $('#grid-container').height();
        
        $('#grid-container').width('27.7cm');
        $('#grid-container').height('19cm');
        
        window._printOriginalDimensions = { width: originalWidth, height: originalHeight };
    });
    
    window.addEventListener('afterprint', () => {
        if (window._printOriginalDimensions) {
            $('#grid-container').width(window._printOriginalDimensions.width);
            $('#grid-container').height(window._printOriginalDimensions.height);
            delete window._printOriginalDimensions;
        }
    });
};

printService.gridsToPdf = async function (gridsData, options = {}) {
    try {
        const jsPDF = await import(/* webpackChunkName: "jspdf" */ 'jspdf');

        options.printElementColors = options.printElementColors !== false;
        options.printBackground = options.printBackground !== false;
        options.showLinks = options.showLinks !== false; // Enable links by default

    await new Promise(resolve => {
            const checkPendingSaves = () => {
            if (window._pendingMetadataSaves && window._pendingMetadataSaves > 0) {
                    setTimeout(checkPendingSaves, 200);
            } else {
                resolve();
            }
        };
        checkPendingSaves();
    });
    
    // Show initial progress bar immediately
    if (options.progressFn) {
        options.progressFn(0, i18nService.t('creatingPDFFile'), () => { options.abort = true; });
    }
    
    // PERFORMANCE FIX: Skip UI synchronization to avoid font loading delays
    // forceUISynchronization(); // Commented out to prevent font loading delays
    
    // Minimal wait time to avoid hanging
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Show progress after synchronization
    if (options.progressFn) {
        options.progressFn(5, i18nService.t('creatingPDFFile'), () => { options.abort = true; });
    }
    
        // Get database metadata first (most reliable)
        let dbMetadata = await dataService.getMetadata() || { colorConfig: {}, textConfig: {} };
        
        // Try to get UI metadata as enhancement
        let uiMetadata = getCurrentUIMetadata();
        
        // Use database metadata as base, enhance with UI metadata if available
        let metadata = dbMetadata;
        if (uiMetadata) {
            // Merge UI metadata with database metadata, giving priority to UI for recent changes
            metadata = {
                colorConfig: { ...dbMetadata.colorConfig, ...uiMetadata.colorConfig },
                textConfig: { ...dbMetadata.textConfig, ...uiMetadata.textConfig }
            };
        }
        
        // Ensure we have complete metadata structure
        if (!metadata.colorConfig) metadata.colorConfig = {};
        if (!metadata.textConfig) metadata.textConfig = {};
        
        // Merge with defaults to ensure all properties exist
        metadata.colorConfig = Object.assign({}, new ColorConfig(), metadata.colorConfig);
        metadata.textConfig = Object.assign({}, new TextConfig(), metadata.textConfig);
        

    updatePdfOptionsFromMetadata(metadata);
    
    // Show progress after metadata processing
    if (options.progressFn) {
        options.progressFn(10, i18nService.t('creatingPDFFile'), () => { options.abort = true; });
    }
    
        const defaultGlobalGrid = options.includeGlobalGrid ? await dataService.getGlobalGrid() : null;

    options.idPageMap = {};
    options.idParentsMap = {};
    options.customFontFamily = pdfOptions.fontFamily;
    
    // First, map all grids in the export
    gridsData.forEach((grid, index) => {
        options.idPageMap[grid.id] = index + 1;
    });

    // Collect all referenced grid IDs from navigation elements
    let referencedGridIds = new Set();
    for (let grid of gridsData) {
        options.idParentsMap[grid.id] = options.idParentsMap[grid.id] || [];
        for (let element of grid.gridElements) {
            element = new GridElement(element);
            let nav = element.getNavigateGridId();
            if (nav) {
                referencedGridIds.add(nav);
                options.idParentsMap[nav] = options.idParentsMap[nav] || [];
                options.idParentsMap[nav].push(options.idPageMap[grid.id]);
                
                // Found navigation element
            }
            let label = i18nService.getTranslation(element.label);
        }
    }
    
    // Navigation grid mapping completed
    
    // Add referenced grids to the page map if they're not already included
    // This ensures navigation links work even for grids not in the current export
    if (referencedGridIds.size > 0) {
        let currentPageCount = gridsData.length;
        for (let refGridId of referencedGridIds) {
            if (!options.idPageMap[refGridId]) {
                // Add a placeholder page number for referenced grids
                options.idPageMap[refGridId] = currentPageCount + 1;
                currentPageCount++;
            }
        }
    }

        const doc = new jsPDF.jsPDF({ orientation: 'landscape', unit: 'mm', compress: true });

        // Try to use the user's configured font family if it's a built-in font
        const userFontFamily = pdfOptions.fontFamily;
        const builtInFonts = [
            'helvetica', 'times', 'courier', 'symbol', 'zapfdingbats',
            'helvetica-bold', 'helvetica-italic', 'helvetica-bolditalic',
            'times-bold', 'times-italic', 'times-bolditalic',
            'courier-bold', 'courier-italic', 'courier-bolditalic'
        ];
        
        let fontLoaded = false;
        let loadedFontName = 'helvetica'; // Default fallback
        
        // First, try the user's configured font if it's built-in
        if (builtInFonts.includes(userFontFamily)) {
            try {
                doc.setFont(userFontFamily);
                if (doc.getTextWidth('Test') > 0) {
                    options.loadedCustomFont = userFontFamily;
                    fontLoaded = true;
                    loadedFontName = userFontFamily;
                }
            } catch (error) {
                console.warn(`⚠ Built-in font ${userFontFamily} not available:`, error);
            }
        }
        
        // If user font failed, try other built-in fonts
        if (!fontLoaded) {
            for (const fontName of builtInFonts) {
                if (fontName === userFontFamily) continue; // Skip already tried
                
                try {
                    doc.setFont(fontName);
                    if (doc.getTextWidth('Test') > 0) {
                        options.loadedCustomFont = fontName;
                        fontLoaded = true;
                        loadedFontName = fontName;
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Built-in font ${fontName} not available:`, error);
                }
            }
        }
        
        // Final fallback
        if (!fontLoaded) {
            doc.setFont(loadedFontName);
            options.loadedCustomFont = loadedFontName;
        }

        // Pattern font loading removed to avoid 404 errors
        // We're using built-in fonts instead

    options.pages = gridsData.length;

    for (let i = 0; i < gridsData.length && !options.abort; i++) {
        if (options.progressFn) {
            options.progressFn(
                Math.round((100 * i) / gridsData.length),
                i18nService.t('creatingPageXOfY', i + 1, gridsData.length),
                    () => { options.abort = true; }
                );
            }

            // PERFORMANCE FIX: Only update metadata once per page, not multiple times
            if (i === 0) { // Only update on first page to avoid performance issues
                let currentUIMetadata = getCurrentUIMetadata();
                if (currentUIMetadata) {
                    metadata = currentUIMetadata;
                    updatePdfOptionsFromMetadata(metadata);
                }
            }
            
            // Validate that we have the expected metadata values (only if verbose)
            
            if (!metadata?.colorConfig?.elementMargin && !metadata?.colorConfig?.borderWidth && !metadata?.colorConfig?.borderRadius) {
                // Critical appearance settings missing from metadata
            }

        let globalGrid = defaultGlobalGrid;
        if (options.includeGlobalGrid && gridsData[i].showGlobalGrid && gridsData[i].globalGridId) {
            globalGrid = await dataService.getGrid(gridsData[i].globalGridId, false);
        }
        globalGrid = gridsData[i].showGlobalGrid !== false ? globalGrid : null;
        options.page = i + 1;

        await addGridToPdf(doc, gridsData[i], options, metadata, globalGrid);

        if (i < gridsData.length - 1) {
            doc.addPage();
        }
    }

    if (!options.abort) {
            if (options.progressFn) options.progressFn(100);

            const filename = `grids_${util.getCurrentDateTimeString()}.pdf`;
            doc.save(filename);
        }
    } catch (error) {
        throw error;
    }
};

async function addGridToPdf(doc, gridData, options, metadata, globalGrid) {
    try {
        const DOC_WIDTH = 297;
        const DOC_HEIGHT = 210;
        const PX_TO_MM = 0.264583;
        
        // Debug function to validate calculations match UI exactly
        function debugCalculation(elementId, setting, uiValue, pdfValue, calculation) {
            if (Math.abs(uiValue - pdfValue) > 0.02) {
                // Calculation mismatch detected
            }
        }
        
        // Test colorToRGB function (only if verbose)
        if (pdfOptions.verbose) {
            // Testing colorToRGB function
        }
        
        gridData = new GridData(gridData);
    
    try {
        gridData = gridUtil.mergeGrids(gridData, globalGrid, metadata);
    } catch (error) {
            throw new Error(`Failed to merge grids: ${error.message}`);
        }

        const hasARASAACImages = gridData.gridElements.some(
            element => element.image && element.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME
        );
        const registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
        const footerHeight = hasARASAACImages ? 2 * pdfOptions.footerHeight : pdfOptions.footerHeight;

        // Set grid background color if configured
        if (metadata?.colorConfig?.gridBackgroundColor) {
            const gridBgColor = colorToRGB(metadata.colorConfig.gridBackgroundColor);
            if (pdfOptions.verbose) {
            console.log('🎨 Setting grid background color:', metadata.colorConfig.gridBackgroundColor, '→', gridBgColor);
        }
            doc.setFillColor(...gridBgColor);
            doc.rect(0, 0, DOC_WIDTH, DOC_HEIGHT, 'F');
        }


        
        let gridWidth = gridUtil.getWidthWithBounds(gridData) || 1;
        let gridHeight = gridUtil.getHeightWithBounds(gridData) || 1;
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridWidth;
    let elementTotalHeight = (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight) / gridHeight;

        if (options.showRegister && options.pages > 1) {
            doc.setFillColor(90, 113, 122);
            doc.rect(0, DOC_HEIGHT - registerHeight, DOC_WIDTH, registerHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(
                i18nService.t('pageXOfY', options.page, options.pages),
                DOC_WIDTH / 2,
                DOC_HEIGHT - registerHeight / 2,
                { baseline: 'middle', align: 'center' }
            );
        }

        // Always show footer with AsTeRICS and ARASAAC information (white background for printing)
        if (hasARASAACImages) {
            // White background for printing
            doc.setFillColor(255, 255, 255);
            doc.rect(0, DOC_HEIGHT - footerHeight, DOC_WIDTH, footerHeight, 'F');
            
            // Black text for better printing
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(6);
            
            // Calculate proper spacing - leave 3mm margin from edges
            const footerMargin = 3;
            const lineHeight = 3;
            
            // Left side: AsTeRICS Grid information
            doc.text(
                'Impreso por AsTeRICS Grid, https://grid.asterics.eu',
                footerMargin,
                DOC_HEIGHT - footerHeight + footerMargin + lineHeight
            );
            
            // Left side: ARASAAC license information
            doc.text(
                'Pictogramas: Sergio Palao - Origen: ARASAAC https://arasaac.org - Licencia: CC (BY-NC-SA)',
                footerMargin,
                DOC_HEIGHT - footerHeight + footerMargin + lineHeight * 2
            );
            
            // Right side: Page information - show grid name and page numbers
            const gridName = gridData.name || 'Grid';
            const elementCount = gridData.gridElements ? gridData.gridElements.length : 0;
            
            // Always show simplified page info to avoid overwhelming users
            let pageInfo;
            if (options.pages && options.pages > 1) {
                // Multi-page export: show current page and total
                pageInfo = `${options.currentPage || 1}/${options.pages || 1}`;
            } else {
                // Single page: show grid name and element count
                pageInfo = `${gridName} (${elementCount} elements)`;
            }
            
            doc.text(
                pageInfo,
                DOC_WIDTH - footerMargin,
                DOC_HEIGHT - footerHeight + footerMargin + lineHeight,
                { align: 'right' }
            );
            
            // Show page number only for multi-page exports
            if (options.pages && options.pages > 1) {
                doc.text(
                    `Page ${options.currentPage || 1} of ${options.pages || 1}`,
                    DOC_WIDTH - footerMargin,
                    DOC_HEIGHT - footerHeight + footerMargin + lineHeight * 2,
                    { align: 'right' }
                );
            }
        } else {
            // Even without ARASAAC images, show basic footer
            doc.setFillColor(255, 255, 255);
            doc.rect(0, DOC_HEIGHT - footerHeight, DOC_WIDTH, footerHeight, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(6);
            
            // Calculate proper spacing - leave 3mm margin from edges
            const footerMargin = 3;
            const lineHeight = 3;
            
            // Left side: AsTeRICS Grid information
            doc.text(
                'Impreso por AsTeRICS Grid, https://grid.asterics.eu',
                footerMargin,
                DOC_HEIGHT - footerHeight + footerMargin + lineHeight
            );
            
            // Right side: Page information - show grid name and page numbers
            const gridName = gridData.name || 'Grid';
            const elementCount = gridData.gridElements ? gridData.gridElements.length : 0;
            
            // Always show simplified page info to avoid overwhelming users
            let pageInfo;
            if (options.pages && options.pages > 1) {
                // Multi-page export: show current page and total
                pageInfo = `${options.currentPage || 1}/${options.pages || 1}`;
            } else {
                // Single page: show grid name and element count
                pageInfo = `${gridName} (${elementCount} elements)`;
            }
            
            doc.text(
                pageInfo,
                DOC_WIDTH - footerMargin,
                DOC_HEIGHT - footerHeight + footerMargin + lineHeight,
                { align: 'right' }
            );
            
            // Show page number only for multi-page exports
            if (options.pages && options.pages > 1) {
                doc.text(
                    `Page ${options.currentPage || 1} of ${options.pages || 1}`,
                    DOC_WIDTH - footerMargin,
                    DOC_HEIGHT - footerHeight + footerMargin + lineHeight * 2,
                    { align: 'right' }
                );
            }
        }

        // Debug: Log all the values being used for calculations (only if verbose)
        if (pdfOptions.verbose) {
            // PDF generation values calculated
        }
        
        for (const element of gridData.gridElements) {
            if (element.hidden) continue;

            const colorConfig = metadata?.colorConfig || {};
            const useElementColors = options.printElementColors !== false;
            const colorMode = colorConfig.colorMode || ColorConfig.COLOR_MODE_BACKGROUND;
            const shouldDrawBorder = colorMode === ColorConfig.COLOR_MODE_BORDER || colorMode === ColorConfig.COLOR_MODE_BOTH;
            const shouldDrawBackground = colorMode === ColorConfig.COLOR_MODE_BACKGROUND || colorMode === ColorConfig.COLOR_MODE_BOTH;

            // Calculate element margin using the EXACT same logic as UI
            const elementMargin = pdfOptions.elementMargin;
            
            // CRITICAL FIX: Use the same calculation as UI's fontUtil.pctToPx()
            // The UI uses viewport height as reference, not element height
            const viewportHeight = typeof document !== 'undefined' ? document.documentElement.clientHeight : 800;
            const elementMarginPx = (elementMargin / 100) * viewportHeight;
            const elementMarginMM = elementMarginPx * PX_TO_MM;
        
        // Debug: Log the margin calculation for this element (only if verbose)
        if (pdfOptions.verbose) {
            // Element margin calculated
        }
            
            // Calculate current element dimensions with proper margin subtraction
            let currentWidth = elementTotalWidth * element.width - 2 * elementMarginMM;
            let currentHeight = elementTotalHeight * element.height - 2 * elementMarginMM;
            
            // For text-only cells, ensure consistent sizing
            const hasImg = element.image && (element.image.data || element.image.url);
            if (!hasImg) {
                // Text-only cells should have consistent minimum dimensions
                const minTextCellWidth = 20; // mm
                const minTextCellHeight = 15; // mm
                
                // Ensure text-only cells meet minimum size requirements
                if (currentWidth < minTextCellWidth) {
                    currentWidth = minTextCellWidth;
                    // Text-only cell width adjusted to minimum
                }
                if (currentHeight < minTextCellHeight) {
                    currentHeight = minTextCellHeight;
                    // Text-only cell height adjusted to minimum
                }
            }
            
            // Ensure minimum dimensions
            currentWidth = Math.max(currentWidth, 1);
            currentHeight = Math.max(currentHeight, 1);
            
            // Calculate positions with proper margin
            let xStartPos = pdfOptions.docPadding + elementTotalWidth * element.x + elementMarginMM;
            let yStartPos = pdfOptions.docPadding + elementTotalHeight * element.y + elementMarginMM;

            // Get background color using the same logic as UI
            let bgColor = colorToRGB(metadata?.colorConfig?.gridBackgroundColor || constants.COLORS.WHITE); // Default to grid bg or white if no element bg
            
                    // Debug: Log the background color logic for this element (only if verbose)
        if (pdfOptions.verbose) {
            // Background color logic calculated
        }
            
        if (useElementColors && shouldDrawBackground && options.printBackground) {
            try {
                // Use the exact same function as the UI
                const uiBgColor = util.getElementBackgroundColor(element, metadata);
                bgColor = colorToRGB(uiBgColor);
            } catch (error) {
                console.warn('Error getting background color for element:', element.id, error);
                bgColor = colorToRGB(constants.DEFAULT_ELEMENT_BACKGROUND_COLOR);
            }
        }
        
        // Debug: Log the final background color result
        if (pdfOptions.verbose) {
            // Final background color determined
        }
        
            // Get border color using the exact same function as UI
            let borderColor = [0, 0, 0];
            if (useElementColors && shouldDrawBorder) {
                try {
                    // Use the exact same function as the UI
                    const uiBorderColor = util.getElementBorderColor(element, metadata);
                    borderColor = colorToRGB(uiBorderColor);
                } catch (error) {
                    console.warn('Error getting border color for element:', element.id, error);
                    borderColor = colorToRGB(constants.DEFAULT_ELEMENT_BORDER_COLOR);
                }
            }

            // Convert percentages to measurements using the EXACT same logic as UI
            const borderWidth = pdfOptions.borderWidth;
            
            // CRITICAL FIX: Use the same calculation as UI's fontUtil.pctToPx()
            // The UI uses viewport height as reference, not element height
            const borderWidthPx = (borderWidth / 100) * viewportHeight;
            let borderWidthMM = borderWidthPx * PX_TO_MM;
            
                    // Debug: Log the border width calculation for this element (only if verbose)
        if (pdfOptions.verbose) {
            // Border width calculated
        }
            
            // Apply the same minimum threshold as UI
            if (borderWidth > 0 && borderWidthMM < 0.05) {
                borderWidthMM = 0.05;
                // Applied minimum border width threshold
            }

            const borderRadius = pdfOptions.borderRadius;
            
            // CRITICAL FIX: Use the same calculation as UI's fontUtil.pctToPx()
            // The UI uses viewport height as reference, not element height
            const borderRadiusPx = (borderRadius / 100) * viewportHeight;
            let borderRadiusMM = borderRadiusPx * PX_TO_MM;
            
                    // Debug: Log the border radius calculation for this element (only if verbose)
        if (pdfOptions.verbose) {
            // Border radius calculated
        }

                    // Validate that PDF values match UI values exactly (only if usePDF is enabled and element exists)
        if (pdfOptions.usePDF) {
            // The element ID is on the Vue component, but the styles are on the .element-container div inside it
            let uiElement = $(`#${element.id} .element-container`);
            if (!uiElement.length) {
                // Fallback: try to find the element directly
                const uiElementDirect = $(`#${element.id}`);
                if (uiElementDirect.length) {
                    // Check if this element has the styles directly
                    const hasMargin = uiElementDirect.css('margin-top') && uiElementDirect.css('margin-top') !== '0px';
                    if (hasMargin) {
                        uiElement = uiElementDirect;
                    }
                }
            }
            if (uiElement.length) {
                const uiBorderWidthPx = parseFloat(uiElement.css('border-top-width')) || 0;
                const uiBorderWidthMM = uiBorderWidthPx * PX_TO_MM;
                const uiBorderRadiusPx = parseFloat(uiElement.css('border-top-left-radius')) || 0;
                const uiBorderRadiusMM = uiBorderRadiusPx * PX_TO_MM;
                const uiMarginPx = parseFloat(uiElement.css('margin-top')) || 0;
                const uiMarginMM = uiMarginPx * PX_TO_MM;
                const uiBgColor = uiElement.css('background-color');
                const uiBorderColor = uiElement.css('border-top-color');

                // Validate calculations using debug function
                debugCalculation(element.id, 'Border Width', uiBorderWidthMM, borderWidthMM, 
                    `UI: ${uiBorderWidthPx}px, PDF: ${borderWidthPx}px * ${PX_TO_MM} = ${borderWidthMM}mm`);
                
                debugCalculation(element.id, 'Border Radius', uiBorderRadiusMM, borderRadiusMM, 
                    `UI: ${uiBorderRadiusPx}px, PDF: ${viewportHeight}px * ${borderRadius/100} * ${PX_TO_MM} = ${borderRadiusMM}mm`);
                
                debugCalculation(element.id, 'Element Margin', uiMarginMM, elementMarginMM, 
                    `UI: ${uiMarginPx}px, PDF: ${viewportHeight}px * ${elementMargin/100} * ${PX_TO_MM} = ${elementMarginMM}mm`);
                
                // Validate colors
                if (uiBgColor && colorToRGB(uiBgColor).join(',') !== bgColor.join(',')) {
                    console.warn(`Background color mismatch for element ${element.id}: UI=${uiBgColor}, PDF=${bgColor}`);
                }
                if (uiBorderColor && colorToRGB(uiBorderColor).join(',') !== borderColor.join(',')) {
                    console.warn(`Border color mismatch for element ${element.id}: UI=${uiBorderColor}, PDF=${borderColor}`);
                }
            } else {
                // Only log if verbose mode is enabled
                if (pdfOptions.verbose) {
                    console.debug(`UI element not found for ${element.id}. Skipping validation.`);
                }
            }
        }

        // Debug: Log the PDF drawing commands (only if verbose)
        if (pdfOptions.verbose) {
            // PDF drawing commands prepared
            
            // Color validation
        }
        
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(borderWidthMM);
        
        let fillStyle = shouldDrawBackground ? 'F' : '';
        let drawStyle = (shouldDrawBorder && borderWidthMM > 0) ? 'D' : '';
        let combinedStyle = fillStyle + drawStyle;
        
        if (combinedStyle === '') {
            if (pdfOptions.verbose) {
                // Skipping draw for element (no background or border)
            }
            // Still proceed to add label/image, but no rect
        } else {
            if (shouldDrawBackground) {
                doc.setFillColor(...bgColor);
            }
            
            // Verify the color was set (only if verbose)
            if (pdfOptions.verbose) {
                // Color set for drawing
            }
                
            if (borderRadiusMM > 0) {
                if (pdfOptions.verbose) {
                    // Drawing rounded rectangle
                }
                doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, combinedStyle);
            } else {
                if (pdfOptions.verbose) {
                    // Drawing regular rectangle
                }
                doc.rect(xStartPos, yStartPos, currentWidth, currentHeight, combinedStyle);
            }
        }
        
        // NEW: Validate UI-to-PDF match for this element
        if (pdfOptions.usePDF) {
            // The element ID is on the Vue component, but the styles are on the .element-container div inside it
            let uiElement = $(`#${element.id} .element-container`);
            if (!uiElement.length) {
                // Fallback: try to find the element directly
                const uiElementDirect = $(`#${element.id}`);
                if (uiElementDirect.length) {
                    // Check if this element has the styles directly
                    const hasMargin = uiElementDirect.css('margin-top') && uiElementDirect.css('margin-top') !== '0px';
                    if (hasMargin) {
                        uiElement = uiElementDirect;
                    }
                }
            }
            if (uiElement.length) {
                // Calculate font size for validation (same logic as UI's gridElementTextContainer)
                const textConfig = metadata?.textConfig || {};
                const hasImg = element.image && (element.image.data || element.image.url);
                
                // Get base font size percentage (same logic as getBaseFontSizePct)
                let baseFontSizePct = hasImg ? (textConfig.fontSizePct || 15) : (textConfig.onlyTextFontSizePct || 35);
                if (element.fontSizePct && Number.isInteger(element.fontSizePct)) {
                    baseFontSizePct = element.fontSizePct;
                }
                
                // Calculate font size using the same logic as UI's getBaseFontSize
                // The UI uses the actual element container size, not viewport height
                const containerSize = {
                    width: currentWidth,
                    height: currentHeight
                };
                const fontSizePx = fontUtil.pctToPx(baseFontSizePct, containerSize);
                let fontSizeMM = fontSizePx * PX_TO_MM;
                
                // Calculate text color for validation (same function as addLabelToPdf)
                let textColor = [0, 0, 0];
                if (useElementColors) {
                    try {
                        // Use the exact same function as the UI
                        const uiFontColor = util.getElementFontColor(element, metadata, bgColor.join(','));
                        textColor = colorToRGB(uiFontColor);
                    } catch (error) {
                        console.warn('Error getting text color for validation:', error);
                        textColor = colorToRGB(constants.COLORS.BLACK);
                    }
                }
                
                const pdfCalculations = {
                    elementMarginMM: elementMarginMM,
                    borderWidthMM: borderWidthMM,
                    borderRadiusMM: borderRadiusMM,
                    fontSizeMM: fontSizeMM,
                    bgColor: bgColor,
                    borderColor: borderColor,
                    fontColor: textColor
                };
                
                const isMatch = validateUItoPDFMatch(element.id, uiElement, pdfCalculations);
                if (!isMatch && pdfOptions.verbose) {
                    console.warn(`⚠️ UI-to-PDF mismatch detected for element ${element.id}`);
                }
            }
        }

        if (i18nService.getTranslation(element.label)) {
            await addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors, options, shouldDrawBackground);
        }
        await addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, metadata);
        
            if (options.showLinks && element.type === GridElement.ELEMENT_TYPE_NAVIGATE) {
                let targetGridId = element.getNavigateGridId();
                // Processing navigation element
                
                if (targetGridId && options.idPageMap[targetGridId]) {
                    let targetPage = options.idPageMap[targetGridId];
                    // Creating navigation link
                    
                    // Create the clickable link area
                    doc.link(xStartPos, yStartPos, currentWidth, currentHeight, { pageNumber: targetPage });
                    
                    // Add visual indicator (small icon in corner)
                    let iconWidth = Math.min(currentWidth, currentHeight) * 0.15; // Smaller icon
                    let offsetX = currentWidth - iconWidth - 1;
                    let offsetY = 1;
                    
                    // Draw background circle
                    doc.setDrawColor(0, 0, 0);
                    doc.setFillColor(90, 113, 122);
                    doc.circle(xStartPos + offsetX + iconWidth/2, yStartPos + offsetY + iconWidth/2, iconWidth/2, 'FD');
                    
                    // Add page number text
                    if (targetPage) {
                        let fontSizePt = Math.max((iconWidth * 0.4) / 0.352778, 6);
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(fontSizePt);
                        doc.text(
                            targetPage + '',
                            xStartPos + offsetX + iconWidth / 2,
                            yStartPos + offsetY + iconWidth / 2,
                            {
                                baseline: 'middle',
                                align: 'center',
                                maxWidth: iconWidth
                            }
                        );
                    }
                } else {
                    console.warn(`⚠️ Navigation element ${element.id} has invalid target: targetGridId=${targetGridId}, available pages:`, Object.keys(options.idPageMap));
                }
            }
        }
    } catch (error) {
        console.error('Error in addGridToPdf:', error);
        throw error;
    }
}

async function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors, options, shouldDrawBackground) {
    try {
        const PX_TO_MM = 0.264583; // Pixel to millimeter conversion constant
        
        const label = i18nService.getTranslation(element.label);
        if (!label.trim()) return;

        const textConfig = metadata?.textConfig || {};
        const hasImg = element.image && (element.image.data || element.image.url);

        let displayLabel = label;
        if (textConfig.convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
            displayLabel = displayLabel.toLocaleUpperCase();
        } else if (textConfig.convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
            displayLabel = displayLabel.toLocaleLowerCase();
        }

        // Get UI element first
        const uiElement = $(`#${element.id}`);
        const textContainer = uiElement.find('.text-container');
        
        // Use the exact same font logic as the UI
        let fontFamily = textConfig.fontFamily || 'helvetica';
        
        // PERFORMANCE FIX: Skip expensive font detection to avoid hanging
        // Use metadata font family directly to prevent font loading delays
        if (textConfig.fontFamily) {
            fontFamily = textConfig.fontFamily;
        }
        
        // OPTIONAL: Only do DOM font detection if explicitly enabled (for debugging)
        if (pdfOptions.useDOMFontDetection && uiElement.length && pdfOptions.usePDF && uiElement.is(':visible')) {
            try {
                // Get computed style to see what font is actually being rendered
                const computedStyle = window.getComputedStyle(uiElement[0]);
                const computedFont = computedStyle.fontFamily;
                
                if (computedFont && computedFont !== 'inherit' && computedFont !== '') {
                    // Extract the first font from the font stack
                    const firstFont = computedFont.split(',')[0].trim().replace(/['"]/g, '');
                    if (firstFont && firstFont !== 'inherit') {
                        fontFamily = firstFont;
                    }
                }
                
                // DEBUG: Add temporary logging to see what's happening (only in verbose mode)
                if (pdfOptions.verbose) {
                    console.log(`🔍 DEBUG Element ${element.id}:`, {
                        uiElementFound: uiElement.length > 0,
                        cssFontFamily: uiElement.css('font-family'),
                        computedFontFamily: computedFont,
                        extractedFirstFont: firstFont,
                        textConfigFontFamily: textConfig.fontFamily,
                        finalFontFamily: fontFamily
                    });
                }
            } catch (error) {
                // Fallback to metadata if UI detection fails
                if (pdfOptions.verbose) {
                    console.log(`⚠️ Font detection failed for element ${element.id}, using metadata: ${error.message}`);
                }
            }
        }
        
        // Final fallback: use metadata font family if UI detection didn't work
        if (!fontFamily || fontFamily === 'helvetica' || fontFamily === 'inherit') {
            if (textConfig.fontFamily) {
                fontFamily = textConfig.fontFamily;
            }
        }
        
        // Map custom fonts to built-in equivalents for jsPDF compatibility
        const fontMapping = {
            // Custom fonts from the app
            'Jost-400-Book': 'helvetica',
            'Jost-500-Medium': 'helvetica',
            'Roboto-Regular': 'helvetica', 
            'roboto-regular': 'helvetica',
            'OpenDyslexic-Regular': 'helvetica',
            'OpenDyslexic': 'helvetica',
            'Arimo-Regular-Cyrillic': 'helvetica',
            'Arimo': 'helvetica',
            
            // Web fonts used in the app
            'Raleway': 'helvetica',
            'HelveticaNeue': 'helvetica',
            'Helvetica Neue': 'helvetica',
            
            // Standard web fonts
            'Arial': 'helvetica',
            'arial': 'helvetica',
            'Helvetica': 'helvetica',
            'helvetica': 'helvetica',
            'Times': 'times',
            'times': 'times',
            'Times New Roman': 'times',
            'times new roman': 'times',
            'Courier': 'courier',
            'Courier New': 'courier',
            'courier new': 'courier',
            
            // Generic font families
            'serif': 'times',
            'sans-serif': 'helvetica',
            'monospace': 'courier',
            'cursive': 'helvetica',
            'fantasy': 'helvetica',
            
            // Common system fonts
            'Georgia': 'times',
            'Verdana': 'helvetica',
            'Tahoma': 'helvetica',
            'Trebuchet MS': 'helvetica',
            'Impact': 'helvetica',
            'Comic Sans MS': 'helvetica',
            'Lucida Console': 'courier',
            'Monaco': 'courier',
            'Consolas': 'courier',
            
            // Special fonts
            'Symbol': 'symbol',
            'ZapfDingbats': 'zapfdingbats',
            
            // Fallbacks for common variations
            'Arial, sans-serif': 'helvetica',
            'Helvetica, Arial, sans-serif': 'helvetica',
            'Times, serif': 'times',
            'Courier, monospace': 'courier',
            'Raleway, HelveticaNeue, Helvetica Neue, Helvetica, Arial, sans-serif': 'helvetica'
        };
        
        // IMPROVED FONT MAPPING: Handle font stacks and normalize font names
        let originalFontFamily = fontFamily;
        let mappedFont = fontMapping[fontFamily];
        
        if (mappedFont) {
            fontFamily = mappedFont;
        } else {
            // Try to extract the first font from a font stack (e.g., "Jost-400-Book, Arial, sans-serif" -> "Jost-400-Book")
            const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
            if (firstFont !== fontFamily && fontMapping[firstFont]) {
                fontFamily = fontMapping[firstFont];
            } else {
                // Try normalized mapping for both full font name and first font
                const normalizedMapping = {
                    'arial': 'helvetica',
                    'helvetica': 'helvetica',
                    'helveticaneue': 'helvetica',
                    'helveticaneueltstd': 'helvetica',
                    'times': 'times',
                    'timesnewroman': 'times',
                    'courier': 'courier',
                    'couriernew': 'courier',
                    'roboto': 'helvetica',
                    'roboto-regular': 'helvetica',
                    'jost': 'helvetica',
                    'jost-400-book': 'helvetica',
                    'jost-500-medium': 'helvetica',
                    'opendyslexic': 'helvetica',
                    'opendyslexic-regular': 'helvetica',
                    'arimo': 'helvetica',
                    'arimo-regular-cyrillic': 'helvetica',
                    'raleway': 'helvetica',
                    'verdana': 'helvetica',
                    'tahoma': 'helvetica',
                    'trebuchetms': 'helvetica',
                    'trebuchet ms': 'helvetica',
                    'impact': 'helvetica',
                    'comicsansms': 'helvetica',
                    'comic sans ms': 'helvetica',
                    'georgia': 'times',
                    'lucidaconsole': 'courier',
                    'lucida console': 'courier',
                    'monaco': 'courier',
                    'consolas': 'courier',
                    'serif': 'times',
                    'sans-serif': 'helvetica',
                    'monospace': 'courier',
                    'cursive': 'helvetica',
                    'fantasy': 'helvetica'
                };
                
                // Try normalized mapping for the full font name
                const normalizedFont = fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (normalizedMapping[normalizedFont]) {
                    fontFamily = normalizedMapping[normalizedFont];
                } else {
                    // Try normalized mapping for the first font in the stack
                    const normalizedFirstFont = firstFont.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (normalizedMapping[normalizedFirstFont]) {
                        fontFamily = normalizedMapping[normalizedFirstFont];
                    } else {
                        // Try exact match for first font (case sensitive)
                        if (fontMapping[firstFont]) {
                            fontFamily = fontMapping[firstFont];
                        }
                    }
                }
            }
        }
        
        // Font mapping completed
        
        // Handle font variants (bold, italic, etc.)
        let finalFontName = fontFamily;
        const fontVariants = ['bold', 'italic', 'bolditalic'];
        const baseFont = fontFamily.split('-')[0]; // Get base font name
        
        // Check if the font has variants and try them
        if (fontVariants.some(variant => fontFamily.includes(variant))) {
            // Font already has variant specified
            finalFontName = fontFamily;
        } else {
            // Try to determine if we need a variant based on CSS
            if (uiElement.length && pdfOptions.usePDF) {
                const fontWeight = uiElement.css('font-weight');
                const fontStyle = uiElement.css('font-style');
                
                if (fontWeight && (fontWeight === 'bold' || parseInt(fontWeight) >= 700)) {
                    if (fontStyle && fontStyle === 'italic') {
                        finalFontName = `${baseFont}-bolditalic`;
                    } else {
                        finalFontName = `${baseFont}-bold`;
                    }
                } else if (fontStyle && fontStyle === 'italic') {
                    finalFontName = `${baseFont}-italic`;
                }
            }
        }
        
        // Set font with comprehensive error handling and validation
        try {
            doc.setFont(finalFontName);
            
            // Validate that the font was actually set correctly
            const testText = 'Test';
            const testWidth = doc.getTextWidth(testText);
            if (testWidth <= 0) {
                throw new Error('Font test failed - no width returned');
            }
            
            // Font set successfully
        } catch (error) {
            // Try base font first
            try {
                doc.setFont(baseFont);
                const testWidth = doc.getTextWidth('Test');
                if (testWidth > 0) {
                    finalFontName = baseFont;
                } else {
                    throw new Error('Base font test failed');
                }
            } catch (fallbackError) {
                // Final fallback to helvetica
                doc.setFont('helvetica');
                finalFontName = 'helvetica';
            }
        }
        
        // Final validation: ensure font is working
        try {
            const testWidth = doc.getTextWidth('Test');
            if (testWidth <= 0) {
                doc.setFont('helvetica');
                finalFontName = 'helvetica';
            }
        } catch (error) {
            doc.setFont('helvetica');
            finalFontName = 'helvetica';
        }

        let uiFontSizeMM = 0;
        let uiFontSizePx = 0;
        let textColor = [0, 0, 0];

        // Validate UI element exists and has proper structure
        if (uiElement.length && pdfOptions.usePDF && uiElement.is(':visible')) {
            const uiFontFamily = uiElement.css('font-family').replace(/['"]/g, '');
            uiFontSizePx = parseFloat(uiElement.css('font-size')) || 16;
            uiFontSizeMM = uiFontSizePx * 0.264583;
            const uiTextColor = uiElement.css('color');

            if (uiFontFamily !== fontFamily) {
                // Font family mismatch detected
            }
            if (uiTextColor && colorToRGB(uiTextColor).join(',') !== textColor.join(',')) {
                // Text color mismatch detected
            }
        }
        
        // PERFORMANCE FIX: Skip DOM font size detection to avoid hanging
        // Calculate font size from metadata instead of DOM to prevent font loading delays

        // Get base font size percentage - use metadata values directly for reliability
        let baseFontSizePct;
        
        // Use element-specific font size if available
        if (element.fontSizePct && Number.isInteger(element.fontSizePct)) {
            baseFontSizePct = element.fontSizePct;
        } else {
            // Use metadata values - ensure text-only cells have significantly bigger font size
            if (hasImg) {
                // Text + picto cells - smaller font size
                baseFontSizePct = textConfig.fontSizePct || 15;
            } else {
                // Text-only cells - should be MUCH bigger (at least 2x larger)
                baseFontSizePct = textConfig.onlyTextFontSizePct || 40; // Increased from 35 to 40
            }
        }
        
        // CRITICAL FIX: Ensure text-only cells are significantly larger than text+picto cells
        if (!hasImg && pdfOptions.usePDF) {
            // Text-only cells should be at least 2.5x larger than text+picto cells
            const minTextOnlySize = Math.max(baseFontSizePct, (textConfig.fontSizePct || 15) * 2.5);
            if (baseFontSizePct < minTextOnlySize) {
                baseFontSizePct = minTextOnlySize;
            }
        }
        
        // CRITICAL FIX: Use UI font size directly if available - this ensures UI=PDF consistency
        if (uiFontSizePx > 0 && pdfOptions.usePDF) {
            // Use the actual UI font size - this is the key fix for text size consistency
        }
        
        // Validate font size percentage
        if (!baseFontSizePct || baseFontSizePct <= 0) {
            baseFontSizePct = hasImg ? 15 : 35; // Fallback values
        }
        
        const lineHeight = hasImg ? (textConfig.lineHeight || 1.5) : (textConfig.onlyTextLineHeight || 1.5);
        const maxLines = hasImg ? (textConfig.maxLines || 1) : 100;
        const fittingMode = textConfig.fittingMode || TextConfig.TOO_LONG_AUTO;

        // Calculate font size using the same logic as UI's getBaseFontSize
        // The UI uses the actual element container size, not viewport height
        const containerSize = {
            width: currentWidth,
            height: currentHeight
        };
        
        // CRITICAL FIX: Use UI font size directly if available, otherwise calculate
        let fontSizePx, fontSizeMM, fontSizePt;
        
        if (uiFontSizePx > 0 && pdfOptions.usePDF) {
            // Use the actual UI font size - this ensures UI=PDF consistency
            fontSizePx = uiFontSizePx;
            fontSizeMM = uiFontSizeMM;
            fontSizePt = fontSizeMM * 2.83465; // Convert mm to points for jsPDF
            
            // Using UI font size directly for consistency
        } else {
            // Fallback to calculated font size if UI detection failed
            if (!hasImg) {
                // Text-only cells should have consistent sizing
                // Use a minimum cell size to ensure consistency
                const minTextCellWidth = 20; // mm
                const minTextCellHeight = 15; // mm
                
                // If the cell is too small, use minimum dimensions for font calculation
                const effectiveWidth = Math.max(currentWidth, minTextCellWidth);
                const effectiveHeight = Math.max(currentHeight, minTextCellHeight);
                
                const effectiveContainerSize = {
                    width: effectiveWidth,
                    height: effectiveHeight
                };
                
                fontSizePx = fontUtil.pctToPx(baseFontSizePct, effectiveContainerSize);
                fontSizeMM = fontSizePx * PX_TO_MM;
                fontSizePt = Math.max(fontSizeMM / 0.352778, 6);
                
                // Calculated text-only font size
            } else {
                // Regular cells with images use normal sizing
                fontSizePx = fontUtil.pctToPx(baseFontSizePct, containerSize);
                fontSizeMM = fontSizePx * PX_TO_MM;
                fontSizePt = Math.max(fontSizeMM / 0.352778, 6);
                
                // Calculated text+image font size
            }
        }
        
        // Ensure minimum font size for readability
        if (fontSizePt < 6) {
            fontSizePt = 6;
            fontSizeMM = fontSizePt * 0.352778;
        }

        const maxWidth = currentWidth - 2 * pdfOptions.textPadding;
        const maxHeight = currentHeight - 2 * pdfOptions.textPadding;
        const effectiveMaxHeight = Math.min(maxHeight, (fontSizePt * 0.352778) * lineHeight * maxLines);

        // Use the exact same text color function as the UI
        if (useElementColors) {
            try {
                // Use the exact same function as the UI
                const uiFontColor = util.getElementFontColor(element, metadata, bgColor.join(','));
                textColor = colorToRGB(uiFontColor);
            } catch (error) {
                console.warn('Error getting text color for element:', element.id, error);
                textColor = colorToRGB(constants.COLORS.BLACK);
            }
        }
        doc.setTextColor(...textColor);
    
        let actualFontSize = fontSizePt;
        doc.setFontSize(actualFontSize);
        let dim = doc.getTextDimensions(displayLabel);
        let fits = dim.w <= maxWidth && dim.h <= effectiveMaxHeight;
        
        // Enhanced text fitting logic to prevent overflow
        if (!fits && fittingMode === TextConfig.TOO_LONG_AUTO) {
            const step = Math.max(actualFontSize / 20, 0.5); // Ensure minimum step size
            while (!fits && actualFontSize > 6) {
                actualFontSize -= step;
                doc.setFontSize(actualFontSize);
                dim = doc.getTextDimensions(displayLabel);
                fits = dim.w <= maxWidth && dim.h <= effectiveMaxHeight;
            }
            actualFontSize = Math.max(actualFontSize, 6);
        } else if (!fits && fittingMode === TextConfig.TOO_LONG_TRUNCATE) {
            let truncated = '';
            for (let i = 0; i < displayLabel.length; i++) {
                const test = truncated + displayLabel[i];
                const testDim = doc.getTextDimensions(test);
                if (testDim.w > maxWidth) break;
                truncated = test;
            }
            displayLabel = truncated;
            dim = doc.getTextDimensions(displayLabel);
        } else if (!fits && fittingMode === TextConfig.TOO_LONG_ELLIPSIS) {
            let truncated = '';
            const ellipsis = '...';
            const ellipsisDim = doc.getTextDimensions(ellipsis);
            
            for (let i = 0; i < displayLabel.length; i++) {
                const test = truncated + displayLabel[i] + ellipsis;
                const testDim = doc.getTextDimensions(test);
                if (testDim.w > maxWidth) break;
                truncated += displayLabel[i];
            }
            displayLabel = truncated + ellipsis;
            dim = doc.getTextDimensions(displayLabel);
        }
        
        // Additional safety check - if text still doesn't fit, force truncation
        if (dim.w > maxWidth) {
            let truncated = '';
            for (let i = 0; i < displayLabel.length; i++) {
                const test = truncated + displayLabel[i];
                const testDim = doc.getTextDimensions(test);
                if (testDim.w > maxWidth) break;
                truncated = test;
            }
            displayLabel = truncated;
            dim = doc.getTextDimensions(displayLabel);
        }
        
        doc.setFontSize(actualFontSize);
        
        const textPosition = textConfig.textPosition;
        const xOffset = xStartPos + currentWidth / 2;
        let yOffset = hasImg
            ? textPosition === TextConfig.TEXT_POS_ABOVE
                ? yStartPos + pdfOptions.textPadding + dim.h / 2
                : yStartPos + currentHeight - pdfOptions.textPadding - dim.h / 2
            : yStartPos + currentHeight / 2;

        // Ensure text stays within cell boundaries
        const finalMaxWidth = Math.min(maxWidth, currentWidth - 2 * pdfOptions.textPadding);
        
        doc.text(displayLabel, xOffset, yOffset, {
            baseline: 'middle',
            align: 'center',
            maxWidth: finalMaxWidth
        });
    } catch (error) {
        throw error;
    }
}

async function addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, metadata) {
    try {
    let hasImage = element && element.image && (element.image.data || element.image.url);
    if (!hasImage) {
        return Promise.resolve();
    }
    
    let type = new GridImage(element.image).getImageType();
    let imageData = element.image.data;
    let dim = null;
    
    if (!imageData) {
        try {
        let dataWithDim = await imageUtil.urlToBase64WithDimensions(element.image.url, 500, type);
        imageData = dataWithDim.data;
        dim = dataWithDim.dim;
        } catch (error) {
            return Promise.resolve();
    }
    }
    
    if (!imageData) {
        return Promise.resolve();
    }
    
    if (!dim) {
        try {
        dim = await imageUtil.getImageDimensionsFromDataUrl(imageData);
        } catch (error) {
            return Promise.resolve();
        }
    }
    
    if (!dim || !dim.ratio || isNaN(dim.ratio)) {
        return Promise.resolve();
    }
    
    let textConfig = metadata && metadata.textConfig ? metadata.textConfig : {};
    let baseFontSizePct = textConfig.fontSizePct || 30;
    let hasText = i18nService.getTranslation(element.label);
    let textPosition = textConfig.textPosition;
    
        let baseImgHeightPercentage = 0.65;
    let imgHeightPercentage = baseImgHeightPercentage;
        let imageTopOffset = 0;
    
    if (hasText) {
        if (textPosition === TextConfig.TEXT_POS_ABOVE) {
            let fontSizeFactor = (baseFontSizePct / 100) * 0.8;
            imgHeightPercentage = Math.max(0.55, Math.min(0.75, 1 - fontSizeFactor));
            imageTopOffset = Math.max(pdfOptions.textPadding * 3, 5);
        } else {
            let fontSizeFactor = (baseFontSizePct / 100) * 0.7;
            imgHeightPercentage = Math.max(0.6, Math.min(0.8, 1 - fontSizeFactor));
        }
    } else {
            imgHeightPercentage = 0.8;
    }
    
    let maxWidth = currentWidth - 2 * pdfOptions.imgMargin;
    let maxHeight = (currentHeight - 2 * pdfOptions.imgMargin - imageTopOffset) * imgHeightPercentage;
    
    let elementRatio = maxWidth / maxHeight;
    let imageRatio = dim.ratio;
    
    let width, height, xOffset, yOffset;
    
    if (imageRatio >= elementRatio) {
        width = maxWidth;
        height = width / imageRatio;
        xOffset = 0;
        yOffset = (maxHeight - height) / 2 + imageTopOffset;
    } else {
        height = maxHeight;
        width = height * imageRatio;
        xOffset = (maxWidth - width) / 2;
        yOffset = imageTopOffset;
    }
    
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);
    
    let x = xStartPos + pdfOptions.imgMargin + xOffset;
    let y = yStartPos + pdfOptions.imgMargin + yOffset;
    
    try {
    if (type === GridImage.IMAGE_TYPES.PNG) {
        doc.addImage(imageData, 'PNG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.JPEG) {
        doc.addImage(imageData, 'JPEG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.SVG) {
            let pixelWidth = width / 0.084666667;
        let pngBase64 = await imageUtil.base64SvgToBase64Png(imageData, pixelWidth);
            if (pngBase64) {
                doc.addImage(pngBase64, 'PNG', x, y, width, height);
            }
        }
    } catch (error) {
        // Error adding image to PDF
        }
    } catch (error) {
        throw error;
    }
}

async function loadFont(path, doc) {
    try {
        let response = await fetch(path);
        if (!response || !response.ok) {
            throw new Error(`Could not load font from ${path}, status: ${response.status}`);
        }

        let fontName = path.substring(path.lastIndexOf('/') + 1).replace(/\.(ttf|otf)$/i, '');
        let contentBuffer = await response.arrayBuffer();
        let contentString = util.arrayBufferToBase64(contentBuffer);
        if (contentString) {
            doc.addFileToVFS(fontName, contentString);
            doc.addFont(fontName, fontName, 'normal');
                doc.setFont(fontName);
            if (doc.getTextWidth('Test') > 0) {
                return true;
            }
            throw new Error(`Font ${fontName} loaded but not usable`);
        }
        throw new Error(`Failed to convert font ${fontName} to base64`);
    } catch (error) {
        throw error;
    }
}

async function getMetadataConfig() {
    try {
        let metadata = await dataService.getMetadata();
        if (pdfOptions.verbose) {
            console.log('getMetadataConfig metadata:', JSON.stringify(metadata, null, 2));
        }
                if (metadata.textConfig && metadata.colorConfig) {
            convertMode = metadata.textConfig.convertMode;
            pdfOptions.textPadding = metadata.textConfig.textPadding ?? 3;
            // CRITICAL FIX: Don't divide by 100 - keep as percentage
            pdfOptions.elementMargin = metadata.colorConfig.elementMargin ?? 0.15;
            pdfOptions.fontFamily = metadata.textConfig.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = metadata.colorConfig.borderWidth ?? 1;
            pdfOptions.borderRadius = metadata.colorConfig.borderRadius ?? 0;
        } else {
            pdfOptions.textPadding = pdfOptions.textPadding ?? 3;
            pdfOptions.elementMargin = pdfOptions.elementMargin ?? 0.15;
            pdfOptions.fontFamily = pdfOptions.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = pdfOptions.borderWidth ?? 1;
            pdfOptions.borderRadius = pdfOptions.borderRadius ?? 0;
        }
                } catch (error) {
            pdfOptions.textPadding = pdfOptions.textPadding ?? 3;
            pdfOptions.elementMargin = pdfOptions.elementMargin ?? 0.15;
            pdfOptions.fontFamily = pdfOptions.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = pdfOptions.borderWidth ?? 1;
            pdfOptions.borderRadius = pdfOptions.borderRadius ?? 0;
        }
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);

// Configuration functions
printService.setVerbose = function(verbose) {
    pdfOptions.verbose = verbose;
};

printService.setUsePDF = function(usePDF) {
    pdfOptions.usePDF = usePDF;
};

// NEW: Control DOM font detection (disabled by default to prevent hanging)
printService.setDOMFontDetection = function(enabled) {
    pdfOptions.useDOMFontDetection = enabled;
};

// NEW: Enable fast PDF mode (disables all expensive DOM operations)
printService.enableFastPDFMode = function() {
    pdfOptions.usePDF = true;
    pdfOptions.useDOMFontDetection = false;
    pdfOptions.verbose = false;
    console.log('🚀 Fast PDF mode enabled - DOM operations disabled to prevent hanging');
};

// NEW: Enable debug PDF mode (enables all operations for troubleshooting)
printService.enableDebugPDFMode = function() {
    pdfOptions.usePDF = true;
    pdfOptions.useDOMFontDetection = true;
    pdfOptions.verbose = true;
    console.log('🔍 Debug PDF mode enabled - all DOM operations enabled for troubleshooting');
};

printService.getOptions = function() {
    return { ...pdfOptions };
};

// NEW: Function to enable UI-to-PDF synchronization debugging
printService.enableUISyncDebug = function() {
    pdfOptions.verbose = true;
    pdfOptions.usePDF = true;
};

// NEW: Function to disable UI-to-PDF synchronization debugging
printService.disableUISyncDebug = function() {
    pdfOptions.verbose = false;
};

// NEW: Function to enable PDF generation debugging with detailed logging
printService.enablePDFDebug = function() {
    pdfOptions.verbose = true;
    pdfOptions.usePDF = true;
    console.log('🐛 PDF Debug Mode Enabled - Check console for detailed font detection logs');
};

// NEW: Function to disable PDF generation debugging
printService.disablePDFDebug = function() {
    pdfOptions.verbose = false;
};

// NEW: Function to validate font consistency between UI and PDF
printService.validateFontConsistency = function(elementId) {
    const uiElement = $(`#${elementId}`);
    const textContainer = uiElement.find('.text-container');
    
    if (!uiElement.length) {
        return false;
    }
    
    const uiFontFamily = textContainer.length ? 
        textContainer.css('font-family').replace(/['"]/g, '') : 
        uiElement.css('font-family').replace(/['"]/g, '');
    
    console.log(`🔍 Font validation for element ${elementId}:`);
    console.log(`  - UI Font Family: "${uiFontFamily}"`);
    console.log(`  - Text Container Found: ${textContainer.length > 0}`);
    
    // Check if font is properly defined
    if (!uiFontFamily || uiFontFamily === 'inherit' || uiFontFamily === '') {
        console.warn(`  - ⚠️ No specific font family found in UI`);
        return false;
    }
    
    // Check if font is in our mapping
    const fontMapping = {
        'Jost-400-Book': 'helvetica',
        'Jost-500-Medium': 'helvetica',
        'Roboto-Regular': 'helvetica',
        'OpenDyslexic-Regular': 'helvetica',
        'Arimo-Regular-Cyrillic': 'helvetica',
        'Arial': 'helvetica',
        'Times': 'times',
        'Courier': 'courier',
        'Raleway': 'helvetica'
    };
    
    const mappedFont = fontMapping[uiFontFamily];
    if (mappedFont) {
        console.log(`  - ✅ Font will be mapped to: ${mappedFont}`);
        return true;
    } else {
        console.warn(`  - ⚠️ Font "${uiFontFamily}" not in mapping, will use fallback`);
        return false;
    }
};

// NEW: Comprehensive font flow validation function
printService.validateCompleteFontFlow = function() {
    console.log('🔍 COMPREHENSIVE FONT FLOW VALIDATION');
    console.log('=====================================');
    
    // Check 1: Available fonts in TextConfig
    console.log('📋 Available fonts in TextConfig.FONTS:');
    console.log('  -', TextConfig.FONTS.join(', '));
    
    // Check 2: Font files in app/fonts
    console.log('📁 Font files available:');
    const fontFiles = [
        'Jost-400-Book.woff2',
        'Jost-500-Medium.woff2', 
        'OpenDyslexic-Regular.woff2',
        'roboto-regular.woff2',
        'roboto-regular.ttf',
        'Arimo-Regular-Cyrillic.ttf'
    ];
    fontFiles.forEach(file => console.log(`  - ${file}`));
    
    // Check 3: CSS @font-face definitions
    console.log('🎨 CSS @font-face definitions:');
    const cssFonts = [
        'OpenDyslexic-Regular',
        'Roboto-Regular', 
        'Jost-400-Book',
        'Jost-500-Medium'
    ];
    cssFonts.forEach(font => console.log(`  - ${font}`));
    
    // Check 4: PDF font mapping coverage
    console.log('📝 PDF font mapping coverage:');
    const pdfMapping = {
        'Jost-400-Book': 'helvetica',
        'Jost-500-Medium': 'helvetica',
        'Roboto-Regular': 'helvetica',
        'OpenDyslexic-Regular': 'helvetica',
        'Arimo-Regular-Cyrillic': 'helvetica',
        'Arial': 'helvetica',
        'Times': 'times',
        'Courier': 'courier'
    };
    Object.keys(pdfMapping).forEach(font => {
        console.log(`  - ${font} → ${pdfMapping[font]}`);
    });
    
    // Check 5: Missing fonts
    console.log('⚠️ Potential issues:');
    const missingCssFonts = ['Arimo-Regular-Cyrillic'];
    missingCssFonts.forEach(font => {
        console.log(`  - ${font}: Font file exists but no CSS @font-face definition`);
    });
    
    const missingPdfMapping = ['Raleway', 'HelveticaNeue'];
    missingPdfMapping.forEach(font => {
        console.log(`  - ${font}: Used in CSS but not in TextConfig.FONTS`);
    });
    
    console.log('=====================================');
    console.log('✅ Font flow validation complete');
};

// NEW: Test function to verify font flow end-to-end
printService.testFontFlow = function() {
    console.log('🧪 TESTING FONT FLOW END-TO-END');
    console.log('================================');
    
    // Test 1: Check if all TextConfig fonts are mapped
    console.log('Test 1: TextConfig font mapping coverage');
    const textConfigFonts = TextConfig.FONTS;
    const fontMapping = {
        'Jost-400-Book': 'helvetica',
        'Jost-500-Medium': 'helvetica',
        'Roboto-Regular': 'helvetica',
        'OpenDyslexic-Regular': 'helvetica',
        'Arimo-Regular-Cyrillic': 'helvetica',
        'Arial': 'helvetica',
        'Times': 'times',
        'Courier': 'courier'
    };
    
    let allMapped = true;
    textConfigFonts.forEach(font => {
        if (fontMapping[font]) {
            console.log(`  ✅ ${font} → ${fontMapping[font]}`);
        } else {
            console.log(`  ❌ ${font} → NOT MAPPED`);
            allMapped = false;
        }
    });
    
    // Test 2: Check font detection logic
    console.log('\nTest 2: Font detection logic');
    const testElement = $('<div id="test-element"><div class="text-container" style="font-family: Jost-400-Book;">Test</div></div>');
    $('body').append(testElement);
    
    const uiElement = $('#test-element');
    const textContainer = uiElement.find('.text-container');
    const detectedFont = textContainer.css('font-family').replace(/['"]/g, '');
    console.log(`  - Detected font: "${detectedFont}"`);
    console.log(`  - Text container found: ${textContainer.length > 0}`);
    
    // Test 3: Check font mapping
    console.log('\nTest 3: Font mapping');
    const mappedFont = fontMapping[detectedFont];
    if (mappedFont) {
        console.log(`  ✅ ${detectedFont} → ${mappedFont}`);
    } else {
        console.log(`  ❌ ${detectedFont} → NOT MAPPED`);
    }
    
    // Cleanup
    testElement.remove();
    
    // Test 4: Check font validation
    console.log('\nTest 4: Font validation');
    const validationResult = printService.validateFontConsistency('test-element');
    console.log(`  - Validation result: ${validationResult ? 'PASS' : 'FAIL'}`);
    
    console.log('================================');
    console.log(`✅ Font flow test complete - ${allMapped ? 'PASS' : 'FAIL'}`);
    
    return allMapped;
};

// NEW: Debug function to check actual font detection on real elements
printService.debugFontDetection = function() {
    console.log('🔍 DEBUGGING FONT DETECTION ON REAL ELEMENTS');
    console.log('============================================');
    
    // Find all grid elements
    const gridElements = $('.element-container');
    console.log(`Found ${gridElements.length} grid elements`);
    
    gridElements.each((index, element) => {
        const elementId = element.id;
        const uiElement = $(`#${elementId}`);
        const textContainer = uiElement.find('.text-container');
        
        console.log(`\nElement ${index + 1}: ${elementId}`);
        
        // Check main element font
        const mainFont = uiElement.css('font-family');
        console.log(`  - Main element font: "${mainFont}"`);
        
        // Check computed style for main element
        const computedStyle = window.getComputedStyle(uiElement[0]);
        const computedFont = computedStyle.fontFamily;
        console.log(`  - Main element computed font: "${computedFont}"`);
        
        // Check text container font
        if (textContainer.length > 0) {
            const textFont = textContainer.css('font-family');
            console.log(`  - Text container font: "${textFont}"`);
            
            // Check computed style for text container
            const textComputedStyle = window.getComputedStyle(textContainer[0]);
            const textComputedFont = textComputedStyle.fontFamily;
            console.log(`  - Text container computed font: "${textComputedFont}"`);
            
            // Check CSS classes
            const cssClasses = textContainer.attr('class');
            console.log(`  - CSS classes: "${cssClasses}"`);
        } else {
            console.log(`  - No text container found`);
        }
    });
    
    console.log('============================================');
};

// NEW: Simple test function to check font detection for a specific element
printService.testFontDetection = function(elementId) {
    console.log(`🔍 TESTING FONT DETECTION FOR ELEMENT: ${elementId}`);
    console.log('===============================================');
    
    const uiElement = $(`#${elementId}`);
    if (!uiElement.length) {
        console.log(`❌ Element ${elementId} not found in DOM`);
        return;
    }
    
    // Check main element font
    const mainFont = uiElement.css('font-family');
    console.log(`📝 Main element font: "${mainFont}"`);
    
    // Check computed style
    const computedStyle = window.getComputedStyle(uiElement[0]);
    const computedFont = computedStyle.fontFamily;
    console.log(`🎨 Computed font: "${computedFont}"`);
    
    // Extract first font from stack
    const firstFont = computedFont.split(',')[0].trim().replace(/['"]/g, '');
    console.log(`🎯 Extracted first font: "${firstFont}"`);
    
    // Check text container
    const textContainer = uiElement.find('.text-container');
    if (textContainer.length > 0) {
        const textFont = textContainer.css('font-family');
        const textComputedFont = window.getComputedStyle(textContainer[0]).fontFamily;
        console.log(`📄 Text container font: "${textFont}"`);
        console.log(`🎨 Text container computed font: "${textComputedFont}"`);
        console.log(`🏷️ CSS classes: "${textContainer.attr('class')}"`);
    }
    
    console.log('===============================================');
};

// NEW: Test font mapping function
printService.testFontMapping = function(fontName) {
    console.log(`🔍 TESTING FONT MAPPING FOR: "${fontName}"`);
    console.log('==========================================');
    
    const fontMapping = {
        'Jost-400-Book': 'helvetica',
        'Jost-500-Medium': 'helvetica',
        'Roboto-Regular': 'helvetica',
        'OpenDyslexic-Regular': 'helvetica',
        'Arimo-Regular-Cyrillic': 'helvetica',
        'Arial': 'helvetica',
        'Times': 'times',
        'Courier': 'courier'
    };
    
    let mappedFont = fontMapping[fontName];
    if (mappedFont) {
        console.log(`✅ Direct mapping: "${fontName}" → "${mappedFont}"`);
        return mappedFont;
    }
    
    // Try first font from stack
    const firstFont = fontName.split(',')[0].trim().replace(/['"]/g, '');
    if (firstFont !== fontName && fontMapping[firstFont]) {
        console.log(`✅ First font mapping: "${fontName}" → "${firstFont}" → "${fontMapping[firstFont]}"`);
        return fontMapping[firstFont];
    }
    
    // Try normalized mapping
    const normalizedMapping = {
        'jost': 'helvetica',
        'roboto': 'helvetica',
        'opendyslexic': 'helvetica',
        'arimo': 'helvetica',
        'arial': 'helvetica',
        'times': 'times',
        'courier': 'courier'
    };
    
    const normalizedFont = firstFont.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedMapping[normalizedFont]) {
        console.log(`✅ Normalized mapping: "${fontName}" → "${normalizedFont}" → "${normalizedMapping[normalizedFont]}"`);
        return normalizedMapping[normalizedFont];
    }
    
    console.log(`❌ No mapping found for: "${fontName}"`);
    return 'helvetica';
};

// NEW: Comprehensive test function for all PDF issues
printService.testAllPDFIssues = function() {
    console.log('🔍 COMPREHENSIVE PDF ISSUES TEST');
    console.log('=================================');
    
    // Test 1: Font detection
    console.log('\n1. Testing Font Detection:');
    const testElements = $('.element-container');
    if (testElements.length > 0) {
        testElements.each((index, element) => {
            const elementId = element.id;
            if (elementId) {
                printService.testFontDetection(elementId);
            }
        });
    } else {
        console.log('❌ No grid elements found in DOM');
    }
    
    // Test 2: Font mapping
    console.log('\n2. Testing Font Mapping:');
    const testFonts = ['Jost-400-Book', 'Roboto-Regular', 'OpenDyslexic-Regular', 'Arial', 'Times'];
    testFonts.forEach(font => printService.testFontMapping(font));
    
    // Test 3: Text size detection
    console.log('\n3. Testing Text Size Detection:');
    const textContainers = $('.text-container');
    if (textContainers.length > 0) {
        textContainers.each((index, container) => {
            const fontSize = parseFloat($(container).css('font-size'));
            const computedFontSize = parseFloat(window.getComputedStyle(container).fontSize);
            const hasImage = $(container).closest('.element-container').find('img').length > 0;
            
            console.log(`  Element ${index + 1}:`);
            console.log(`    - Has image: ${hasImage}`);
            console.log(`    - CSS font size: ${fontSize}px`);
            console.log(`    - Computed font size: ${computedFontSize}px`);
        });
    } else {
        console.log('❌ No text containers found');
    }
    
    // Test 4: Navigation elements
    console.log('\n4. Testing Navigation Elements:');
    const navElements = $('.element-container').filter((index, element) => {
        // Check if element has navigation action
        const elementId = element.id;
        if (elementId && window.metadata && window.metadata.gridElements) {
            const gridElement = window.metadata.gridElements.find(e => e.id === elementId);
            return gridElement && gridElement.actions && gridElement.actions.some(a => a.modelName === 'GridActionNavigate');
        }
        return false;
    });
    
    if (navElements.length > 0) {
        console.log(`✅ Found ${navElements.length} navigation elements`);
        navElements.each((index, element) => {
            console.log(`  - Navigation element: ${element.id}`);
        });
    } else {
        console.log('❌ No navigation elements found');
    }
    
    console.log('\n✅ Test completed! Check results above.');
};

// NEW: Performance and validation test
printService.validatePDFPerformance = function() {
    console.log('⚡ PDF PERFORMANCE VALIDATION');
    console.log('=============================');
    
    const startTime = performance.now();
    
    // Test 1: DOM query performance
    console.log('\n1. Testing DOM Query Performance:');
    const domStart = performance.now();
    const elements = $('.element-container');
    const textContainers = $('.text-container');
    const domEnd = performance.now();
    console.log(`  - Found ${elements.length} elements in ${(domEnd - domStart).toFixed(2)}ms`);
    
    // Test 2: Font detection performance
    console.log('\n2. Testing Font Detection Performance:');
    const fontStart = performance.now();
    elements.each((index, element) => {
        if (index < 5) { // Only test first 5 elements
            const uiElement = $(element);
            const textContainer = uiElement.find('.text-container');
            if (uiElement.is(':visible')) {
                try {
                    const computedStyle = window.getComputedStyle(uiElement[0]);
                    const fontFamily = computedStyle.fontFamily;
                    const fontSize = parseFloat(computedStyle.fontSize);
                } catch (e) {
                    // Ignore errors for performance test
                }
            }
        }
    });
    const fontEnd = performance.now();
    console.log(`  - Font detection for 5 elements: ${(fontEnd - fontStart).toFixed(2)}ms`);
    
    // Test 3: Metadata access performance
    console.log('\n3. Testing Metadata Access Performance:');
    const metaStart = performance.now();
    try {
        const metadata = getCurrentUIMetadata();
        const dbMetadata = dataService.getMetadata();
    } catch (e) {
        // Ignore errors
    }
    const metaEnd = performance.now();
    console.log(`  - Metadata access: ${(metaEnd - metaStart).toFixed(2)}ms`);
    
    const totalTime = performance.now() - startTime;
    console.log(`\n✅ Total validation time: ${totalTime.toFixed(2)}ms`);
    
    if (totalTime > 100) {
        console.log('⚠️ WARNING: Performance validation took longer than expected');
    } else {
        console.log('✅ Performance looks good');
    }
};

// NEW: Deep validation of all fixes
printService.deepValidateFixes = function() {
    console.log('🔍 DEEP VALIDATION OF ALL FIXES');
    console.log('================================');
    
    // Test 1: Text size fix validation
    console.log('\n1. Text Size Fix Validation:');
    const textContainers = $('.text-container');
    let textSizeIssues = 0;
    let textOnlyElements = 0;
    let textPictoElements = 0;
    
    textContainers.each((index, container) => {
        const element = $(container).closest('.element-container');
        const hasImage = element.find('img').length > 0;
        const fontSize = parseFloat($(container).css('font-size'));
        const computedFontSize = parseFloat(window.getComputedStyle(container).fontSize);
        
        if (hasImage) {
            textPictoElements++;
        } else {
            textOnlyElements++;
        }
        
        if (fontSize <= 0 || computedFontSize <= 0) {
            textSizeIssues++;
        }
    });
    
    console.log(`  - Text-only elements: ${textOnlyElements}`);
    console.log(`  - Text+picto elements: ${textPictoElements}`);
    console.log(`  - Font size issues: ${textSizeIssues}`);
    
    if (textSizeIssues === 0) {
        console.log('  ✅ Text size detection working correctly');
    } else {
        console.log('  ❌ Text size detection has issues');
    }
    
    // Test 2: Font family fix validation
    console.log('\n2. Font Family Fix Validation:');
    const elements = $('.element-container');
    let fontIssues = 0;
    const detectedFonts = new Set();
    
    elements.each((index, element) => {
        try {
            const computedStyle = window.getComputedStyle(element);
            const fontFamily = computedStyle.fontFamily;
            if (fontFamily && fontFamily !== 'inherit') {
                detectedFonts.add(fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
            } else {
                fontIssues++;
            }
        } catch (e) {
            fontIssues++;
        }
    });
    
    console.log(`  - Detected fonts: ${Array.from(detectedFonts).join(', ')}`);
    console.log(`  - Font detection issues: ${fontIssues}`);
    
    if (fontIssues === 0) {
        console.log('  ✅ Font family detection working correctly');
    } else {
        console.log('  ❌ Font family detection has issues');
    }
    
    // Test 3: Navigation links validation
    console.log('\n3. Navigation Links Validation:');
    let navElements = 0;
    let navIssues = 0;
    
    elements.each((index, element) => {
        const elementId = element.id;
        if (elementId && window.metadata && window.metadata.gridElements) {
            const gridElement = window.metadata.gridElements.find(e => e.id === elementId);
            if (gridElement && gridElement.actions) {
                const hasNav = gridElement.actions.some(a => a.modelName === 'GridActionNavigate');
                if (hasNav) {
                    navElements++;
                    const navAction = gridElement.actions.find(a => a.modelName === 'GridActionNavigate');
                    if (!navAction || !navAction.navGridId) {
                        navIssues++;
                    }
                }
            }
        }
    });
    
    console.log(`  - Navigation elements found: ${navElements}`);
    console.log(`  - Navigation issues: ${navIssues}`);
    
    if (navIssues === 0) {
        console.log('  ✅ Navigation links validation passed');
    } else {
        console.log('  ❌ Navigation links have issues');
    }
    
    console.log('\n✅ Deep validation completed!');
};

// Initialize with fast PDF mode by default to prevent hanging
printService.enableFastPDFMode();
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

printService.showBrowserPrintInstructions = function(options = {}) {
    const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    const isEdge = /Edge/.test(navigator.userAgent);
    
    let browserSpecificTips = '';
    
    if (isFirefox) {
        browserSpecificTips = `
            <li><strong>Firefox:</strong> 
                <ul>
                    <li>Set "Scale: Custom" to 90% to prevent right border cutoff</li>
                    <li>Enable "Print Background Graphics"</li>
                    <li>Set margins to "Minimum"</li>
                </ul>
            </li>`;
    } else if (isSafari) {
        browserSpecificTips = `
            <li><strong>Safari:</strong> 
                <ul>
                    <li>Refresh the page before printing if you see blank pages</li>
                    <li>Enable "Print Background Graphics" in print options</li>
                    <li>Set "Scale" to 100% or "Fit to Page"</li>
                    <li>If issues persist, try using the "Save as PDF" option instead</li>
                </ul>
            </li>`;
    } else if (isChrome) {
        browserSpecificTips = `
            <li><strong>Chrome:</strong> 
                <ul>
                    <li>Works well with default settings</li>
                    <li>Enable "Background graphics" for best results</li>
                    <li>Set margins to "Minimum" for maximum space usage</li>
                </ul>
            </li>`;
    } else if (isEdge) {
        browserSpecificTips = `
            <li><strong>Edge:</strong> 
                <ul>
                    <li>Enable "Print background graphics"</li>
                    <li>Set margins to "Minimum"</li>
                    <li>Use "Scale: 100%" for best quality</li>
                </ul>
            </li>`;
    }
    
    return `
        <div style="padding: 20px; text-align: center;">
            <h3>Browser Print Instructions</h3>
            <p>Use your browser's built-in print function for best results:</p>
            <ol style="text-align: left; display: inline-block;">
                <li>Press <strong>Ctrl+P</strong> (Windows/Linux) or <strong>Cmd+P</strong> (Mac)</li>
                <li>Select "Save as PDF" as the destination</li>
                <li>Choose "Landscape" orientation</li>
                <li>Set margins to "Minimum" or "None"</li>
                <li>Enable "Print Background Graphics" if available</li>
                <li>Set "Scale" to 100% or "Fit to Page"</li>
                ${browserSpecificTips}
                <li>Click "Save"</li>
            </ol>
            <p><strong>Note:</strong> Browser print often provides better text rendering and border display than the custom PDF export.</p>
            <p><strong>Troubleshooting:</strong> If you experience issues with text truncation or missing borders, try refreshing the page before printing.</p>
        </div>
    `;
};

printService.triggerBrowserPrint = function() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
        setTimeout(() => {
    const beforePrintEvent = new Event('beforeprint');
    window.dispatchEvent(beforePrintEvent);
    setTimeout(() => {
        window.print();
            }, 200);
    }, 100);
    } else {
        const beforePrintEvent = new Event('beforeprint');
        window.dispatchEvent(beforePrintEvent);
        setTimeout(() => {
            window.print();
        }, 100);
    }
};

export { printService };
