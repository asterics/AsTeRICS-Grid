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
        
        console.log('🔄 Forced UI synchronization completed');
    } catch (error) {
        console.warn('⚠️ Error during UI synchronization:', error);
    }
}

// NEW: Function to get the most current UI metadata
function getCurrentUIMetadata() {
    try {
        // Method 1: Try to get from Vue app instance (vueApp is the global variable used in the codebase)
        if (typeof window !== 'undefined' && typeof vueApp !== 'undefined' && vueApp && vueApp.metadata) {
            console.log('✅ Using vueApp metadata for PDF');
            return JSON.parse(JSON.stringify(vueApp.metadata)); // Deep clone
        }
        
        // Method 1b: Try to get from window.app if it exists
        if (typeof window !== 'undefined' && window.app && window.app.$children) {
            for (let child of window.app.$children) {
                if (child.metadata && child.metadata.colorConfig && child.metadata.textConfig) {
                    console.log('✅ Using Vue component metadata for PDF');
                    return JSON.parse(JSON.stringify(child.metadata)); // Deep clone
                }
            }
        }
        
        // Method 2: Try to get from global window object
        if (typeof window !== 'undefined' && window.metadata) {
            console.log('✅ Using window metadata for PDF');
            return JSON.parse(JSON.stringify(window.metadata)); // Deep clone
        }
        
        // Method 3: Try to get from current view component
        if (typeof window !== 'undefined' && window.currentView && window.currentView.metadata) {
            console.log('✅ Using current view metadata for PDF');
            return JSON.parse(JSON.stringify(window.currentView.metadata)); // Deep clone
        }
        
        console.warn('⚠️ No UI metadata found, will use database metadata');
        return null;
    } catch (error) {
        console.error('Error getting UI metadata:', error);
        return null;
    }
}

// NEW: Function to validate UI-to-PDF calculations match exactly
function validateUItoPDFMatch(elementId, uiElement, pdfCalculations) {
    if (!uiElement || !uiElement.length) {
        console.warn(`⚠️ UI element ${elementId} not found for validation`);
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
        console.log(`✅ UI-to-PDF perfect match for element ${elementId}`);
    }
    
    return allMatch;
}

function updatePdfOptionsFromMetadata(metadata) {
    console.log('🔧 Updating PDF options from metadata:', {
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
        console.log(`🔧 Updated elementMargin: ${metadata.colorConfig.elementMargin}%`);
    } else {
        pdfOptions.elementMargin = 0.15; // Default to 0.15% (matches ColorConfig default)
        missingFields.push('colorConfig.elementMargin');
    }

    if (metadata?.textConfig?.textPadding != null) {
        pdfOptions.textPadding = metadata.textConfig.textPadding;
        console.log(`🔧 Updated textPadding: ${metadata.textConfig.textPadding}mm`);
    } else {
        pdfOptions.textPadding = 2; // Default to 2mm (matches TextConfig default)
        missingFields.push('textConfig.textPadding');
    }

    if (metadata?.textConfig?.fontFamily != null) {
        pdfOptions.fontFamily = metadata.textConfig.fontFamily;
        console.log(`🔧 Updated fontFamily: ${metadata.textConfig.fontFamily}`);
    } else {
        pdfOptions.fontFamily = 'Arial'; // Default to Arial (matches TextConfig default)
        missingFields.push('textConfig.fontFamily');
    }

    if (metadata?.colorConfig?.borderWidth != null) {
        pdfOptions.borderWidth = metadata.colorConfig.borderWidth;
        console.log(`🔧 Updated borderWidth: ${metadata.colorConfig.borderWidth}%`);
    } else {
        pdfOptions.borderWidth = 0.1; // Default to 0.1% (matches ColorConfig default)
        missingFields.push('colorConfig.borderWidth');
    }

    if (metadata?.colorConfig?.borderRadius != null) {
        pdfOptions.borderRadius = metadata.colorConfig.borderRadius;
        console.log(`🔧 Updated borderRadius: ${metadata.colorConfig.borderRadius}%`);
    } else {
        pdfOptions.borderRadius = 0.4; // Default to 0.4% (matches ColorConfig default)
        missingFields.push('colorConfig.borderRadius');
    }

    if (missingFields.length > 0) {
        console.warn(`⚠️ Missing metadata fields, using defaults: ${missingFields.join(', ')}`);
        if (pdfOptions.verbose) {
            console.log('Metadata received:', JSON.stringify(metadata, null, 2));
        }
    }

    if (pdfOptions.verbose) {
        console.log('🔧 Final PDF options:', JSON.stringify(pdfOptions, null, 2));
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
        console.log('🚀 PDF Generation started with grids:', gridsData.length, 'options:', options);
        const jsPDF = await import(/* webpackChunkName: "jspdf" */ 'jspdf');

        options.printElementColors = options.printElementColors !== false;
        options.printBackground = options.printBackground !== false;
        options.showLinks = options.showLinks !== false; // Enable links by default

    await new Promise(resolve => {
            const checkPendingSaves = () => {
                console.log('Pending metadata saves:', window._pendingMetadataSaves);
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
    
    // OPTIMIZED: Quick UI synchronization for faster PDF generation
    console.log('⏳ Quick UI synchronization...');
    forceUISynchronization();
    
    // Reduced wait time for faster response
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('✅ UI synchronization completed, proceeding with PDF generation');
    
    // Show progress after synchronization
    if (options.progressFn) {
        options.progressFn(5, i18nService.t('creatingPDFFile'), () => { options.abort = true; });
    }
    
        // Get database metadata first (most reliable)
        let dbMetadata = await dataService.getMetadata() || { colorConfig: {}, textConfig: {} };
        console.log('💾 Database Metadata for PDF:', JSON.stringify(dbMetadata, null, 2));
        
        // Try to get UI metadata as enhancement
        let uiMetadata = getCurrentUIMetadata();
        console.log('🎨 UI Metadata for PDF:', JSON.stringify(uiMetadata, null, 2));
        
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
        
        console.log('🎯 Final metadata for PDF:', JSON.stringify(metadata, null, 2));

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
            }
            let label = i18nService.getTranslation(element.label);
        }
    }
    
    // Add referenced grids to the page map if they're not already included
    // This ensures navigation links work even for grids not in the current export
    if (referencedGridIds.size > 0) {
        console.log('🔗 Found referenced grids:', Array.from(referencedGridIds));
        let currentPageCount = gridsData.length;
        for (let refGridId of referencedGridIds) {
            if (!options.idPageMap[refGridId]) {
                // Add a placeholder page number for referenced grids
                options.idPageMap[refGridId] = currentPageCount + 1;
                currentPageCount++;
                console.log(`📍 Added referenced grid ${refGridId} to page map as page ${options.idPageMap[refGridId]}`);
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
                    if (pdfOptions.verbose) {
                        console.log(`✅ Using built-in font: ${userFontFamily}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Built-in font ${userFontFamily} not available:`, error);
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
                        if (pdfOptions.verbose) {
                            console.log(`✅ Using built-in font: ${fontName}`);
                        }
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Built-in font ${fontName} not available:`, error);
                }
            }
        }
        
        // Final fallback
        if (!fontLoaded) {
            console.warn(`⚠️ All built-in font attempts failed, using ${loadedFontName} as fallback`);
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

            // NEW: Re-validate metadata for each page to ensure we have the latest UI state
            let currentUIMetadata = getCurrentUIMetadata();
            if (currentUIMetadata) {
                metadata = currentUIMetadata;
                updatePdfOptionsFromMetadata(metadata);
                console.log(`🔄 Updated metadata for page ${i + 1} from UI`);
            }

            updatePdfOptionsFromMetadata(metadata);
            
            // Validate that we have the expected metadata values (only if verbose)
            if (pdfOptions.verbose) {
                console.log('🔍 Validating metadata completeness:');
                console.log('  - colorConfig.elementMargin:', metadata?.colorConfig?.elementMargin, 'expected: number');
                console.log('  - colorConfig.borderWidth:', metadata?.colorConfig?.borderWidth, 'expected: number');
                console.log('  - colorConfig.borderRadius:', metadata?.colorConfig?.borderRadius, 'expected: number');
                console.log('  - colorConfig.elementBackgroundColor:', metadata?.colorConfig?.elementBackgroundColor, 'expected: color');
                console.log('  - colorConfig.elementBorderColor:', metadata?.colorConfig?.elementBorderColor, 'expected: color');
                console.log('  - colorConfig.colorMode:', metadata?.colorConfig?.colorMode, 'expected: string');
            }
            
            if (!metadata?.colorConfig?.elementMargin && !metadata?.colorConfig?.borderWidth && !metadata?.colorConfig?.borderRadius) {
                console.warn('⚠️ WARNING: Critical appearance settings missing from metadata!');
                console.warn('   This will cause the PDF to use default values instead of user settings.');
                console.warn('   Try refreshing the page or checking if settings are saved.');
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
        console.error('Error in PDF generation:', error);
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
                console.warn(`🔍 CALCULATION MISMATCH for ${elementId}:`);
                console.warn(`  Setting: ${setting}`);
                console.warn(`  UI Value: ${uiValue.toFixed(3)}mm`);
                console.warn(`  PDF Value: ${pdfValue.toFixed(3)}mm`);
                console.warn(`  Calculation: ${calculation}`);
                console.warn(`  Difference: ${Math.abs(uiValue - pdfValue).toFixed(3)}mm`);
            }
        }
        
        // Test colorToRGB function (only if verbose)
        if (pdfOptions.verbose) {
            console.log('🧪 Testing colorToRGB function:');
            console.log('  - Test 1: White color:', colorToRGB('#ffffff'));
            console.log('  - Test 2: Black color:', colorToRGB('#000000'));
            console.log('  - Test 3: Red color:', colorToRGB('#ff0000'));
            console.log('  - Test 4: Default background:', colorToRGB(constants.DEFAULT_ELEMENT_BACKGROUND_COLOR));
        }
        
        gridData = new GridData(gridData);
    
    try {
        gridData = gridUtil.mergeGrids(gridData, globalGrid, metadata);
    } catch (error) {
            console.error('Failed to merge grids:', error);
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
            console.log('🔍 DEBUG: Values for PDF generation:');
            console.log('  - pdfOptions.elementMargin:', pdfOptions.elementMargin, '%');
            console.log('  - pdfOptions.borderWidth:', pdfOptions.borderWidth, '%');
            console.log('  - pdfOptions.borderRadius:', pdfOptions.borderRadius, '%');
            console.log('  - elementTotalWidth:', elementTotalWidth, 'mm');
            console.log('  - elementTotalHeight:', elementTotalHeight, 'mm');
            console.log('  - PX_TO_MM:', PX_TO_MM);
            console.log('  - metadata.colorConfig:', JSON.stringify(metadata?.colorConfig, null, 2));
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
            console.log(`🔍 Element ${element.id} margin calculation:`);
            console.log(`  - elementMargin: ${elementMargin}%`);
            console.log(`  - viewportHeight: ${viewportHeight}px`);
            console.log(`  - elementMarginPx: ${elementMarginPx}px`);
            console.log(`  - elementMarginMM: ${elementMarginMM}mm`);
        }
            
            // Calculate current element dimensions with proper margin subtraction
            let currentWidth = elementTotalWidth * element.width - 2 * elementMarginMM;
            let currentHeight = elementTotalHeight * element.height - 2 * elementMarginMM;
            
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
            console.log(`🔍 Element ${element.id} background color logic:`);
            console.log(`  - useElementColors: ${useElementColors}`);
            console.log(`  - shouldDrawBackground: ${shouldDrawBackground}`);
            console.log(`  - options.printBackground: ${options.printBackground}`);
            console.log(`  - element.type: ${element.type}`);
            console.log(`  - colorConfig.colorMode: ${colorConfig.colorMode}`);
            console.log(`  - element.colorCategory: ${element.colorCategory}`);
            console.log(`  - colorConfig.colorSchemesActivated: ${colorConfig.colorSchemesActivated}`);
            console.log(`  - colorConfig.elementBackgroundColor: ${colorConfig.elementBackgroundColor}`);
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
            console.log(`🎨 Element ${element.id} final background color:`, bgColor);
            console.log(`  - RGB values: [${bgColor.join(', ')}]`);
            console.log(`  - Will be applied: ${shouldDrawBackground}`);
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
            console.log(`🔍 Element ${element.id} border width calculation:`);
            console.log(`  - borderWidth: ${borderWidth}%`);
            console.log(`  - viewportHeight: ${viewportHeight}px`);
            console.log(`  - borderWidthPx: ${borderWidthPx}px`);
            console.log(`  - borderWidthMM: ${borderWidthMM}mm`);
        }
            
            // Apply the same minimum threshold as UI
            if (borderWidth > 0 && borderWidthMM < 0.05) {
                borderWidthMM = 0.05;
                console.log(`  - Applied minimum threshold: ${borderWidthMM}mm`);
            }

            const borderRadius = pdfOptions.borderRadius;
            
            // CRITICAL FIX: Use the same calculation as UI's fontUtil.pctToPx()
            // The UI uses viewport height as reference, not element height
            const borderRadiusPx = (borderRadius / 100) * viewportHeight;
            let borderRadiusMM = borderRadiusPx * PX_TO_MM;
            
                    // Debug: Log the border radius calculation for this element (only if verbose)
        if (pdfOptions.verbose) {
            console.log(`🔍 Element ${element.id} border radius calculation:`);
            console.log(`  - borderRadius: ${borderRadius}%`);
            console.log(`  - viewportHeight: ${viewportHeight}px`);
            console.log(`  - borderRadiusPx: ${borderRadiusPx}px`);
            console.log(`  - borderRadiusMM: ${borderRadiusMM}mm`);
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
            console.log(`🎨 Element ${element.id} PDF drawing commands:`);
            console.log(`  - Setting fill color: [${bgColor.join(', ')}] (if drawing background)`);
            console.log(`  - Setting draw color: [${borderColor.join(', ')}]`);
            console.log(`  - Setting line width: ${borderWidthMM}mm`);
            console.log(`  - Drawing at position: (${xStartPos}, ${yStartPos})`);
            console.log(`  - Dimensions: ${currentWidth}mm x ${currentHeight}mm`);
            console.log(`  - Border radius: ${borderRadiusMM}mm`);
            console.log(`  - Will draw border: ${shouldDrawBorder && borderWidthMM > 0}`);
            console.log(`  - Will draw background: ${shouldDrawBackground}`);
            
            // CRITICAL: Test if the color is actually being set
            const beforeFillColor = doc.getFillColor();
            const beforeColorStr = Array.isArray(beforeFillColor) ? beforeFillColor.join(', ') : String(beforeFillColor);
            console.log(`  - Fill color before setting: [${beforeColorStr}]`);
        }
        
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(borderWidthMM);
        
        let fillStyle = shouldDrawBackground ? 'F' : '';
        let drawStyle = (shouldDrawBorder && borderWidthMM > 0) ? 'D' : '';
        let combinedStyle = fillStyle + drawStyle;
        
        if (combinedStyle === '') {
            if (pdfOptions.verbose) {
                console.log(`  - Skipping draw for element ${element.id} (no background or border)`);
            }
            // Still proceed to add label/image, but no rect
        } else {
            if (shouldDrawBackground) {
                doc.setFillColor(...bgColor);
            }
            
            // Verify the color was set (only if verbose)
            if (pdfOptions.verbose) {
                const afterFillColor = doc.getFillColor();
                const afterColorStr = Array.isArray(afterFillColor) ? afterFillColor.join(', ') : String(afterFillColor);
                console.log(`  - Fill color after setting: [${afterColorStr}]`);
                
                const colorSetSuccessfully = shouldDrawBackground ? 
                    (Array.isArray(afterFillColor) && afterFillColor.length === bgColor.length && afterFillColor.every((val, idx) => Math.abs(val - bgColor[idx]) < 1)) : true;
                console.log(`  - Color set successfully: ${colorSetSuccessfully}`);
            }
                
            if (borderRadiusMM > 0) {
                if (pdfOptions.verbose) {
                    console.log(`  - Drawing rounded rectangle with style '${combinedStyle}'`);
                }
                doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, combinedStyle);
            } else {
                if (pdfOptions.verbose) {
                    console.log(`  - Drawing regular rectangle with style '${combinedStyle}'`);
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
                console.log(`🔗 Processing navigation element ${element.id}: targetGridId=${targetGridId}`);
                
                if (targetGridId && options.idPageMap[targetGridId]) {
                    let targetPage = options.idPageMap[targetGridId];
                    console.log(`✅ Creating link to page ${targetPage} for element ${element.id}`);
                    
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
        
        // Use the exact same font logic as the UI
        let fontFamily = textConfig.fontFamily || 'helvetica';
        
        // Get font family from UI if available
        if (uiElement.length && pdfOptions.usePDF) {
            const uiFontFamily = uiElement.css('font-family').replace(/['"]/g, '');
            if (uiFontFamily && uiFontFamily !== 'inherit') {
                fontFamily = uiFontFamily;
                console.log(`🎨 Using UI font family: ${fontFamily}`);
            }
        }
        
        // Map custom fonts to built-in equivalents for jsPDF compatibility
        const fontMapping = {
            'Jost-400-Book': 'helvetica',
            'Roboto-Regular': 'helvetica', 
            'OpenDyslexic-Regular': 'helvetica',
            'Times': 'times',
            'Arial': 'helvetica',
            'serif': 'times',
            'sans-serif': 'helvetica',
            'monospace': 'courier',
            'Helvetica': 'helvetica',
            'Times New Roman': 'times',
            'Courier New': 'courier',
            'Symbol': 'symbol',
            'ZapfDingbats': 'zapfdingbats',
            'Georgia': 'times',
            'Verdana': 'helvetica',
            'Tahoma': 'helvetica',
            'Trebuchet MS': 'helvetica',
            'Impact': 'helvetica',
            'Comic Sans MS': 'helvetica'
        };
        
        // Use mapped font or keep original if it's a standard font
        const mappedFont = fontMapping[fontFamily];
        if (mappedFont) {
            fontFamily = mappedFont;
            console.log(`🔄 Mapped font: ${fontFamily} -> ${mappedFont}`);
        } else {
            // Try to use the original font name if it's not in our mapping
            console.log(`🎯 Using original font: ${fontFamily}`);
        }
        
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
        
        // Set font with error handling
        try {
            doc.setFont(finalFontName);
            console.log(`✅ Successfully set font: ${finalFontName}`);
        } catch (error) {
            console.warn(`Font '${finalFontName}' not available, trying base font '${baseFont}'`);
            try {
                doc.setFont(baseFont);
                console.log(`✅ Using base font: ${baseFont}`);
            } catch (fallbackError) {
                console.warn(`Base font '${baseFont}' not available, falling back to helvetica`);
                doc.setFont('helvetica');
                finalFontName = 'helvetica';
            }
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
                console.debug(`Font family mismatch for element ${element.id}: UI=${uiFontFamily}, PDF=${fontFamily}`);
            }
            if (uiTextColor && colorToRGB(uiTextColor).join(',') !== textColor.join(',')) {
                console.debug(`Text color mismatch for element ${element.id}: UI=${uiTextColor}, PDF=${textColor}`);
            }
        }

        // Get base font size percentage - use metadata values directly for reliability
        let baseFontSizePct;
        
        // Use element-specific font size if available
        if (element.fontSizePct && Number.isInteger(element.fontSizePct)) {
            baseFontSizePct = element.fontSizePct;
            console.log(`📏 Using element-specific font size: ${baseFontSizePct}%`);
        } else {
            // Use metadata values - ensure text-only cells have bigger font size
            if (hasImg) {
                // Text + picto cells
                baseFontSizePct = textConfig.fontSizePct || 15;
            } else {
                // Text-only cells - should be bigger
                baseFontSizePct = textConfig.onlyTextFontSizePct || 35;
            }
            console.log(`📏 Using metadata font size: ${baseFontSizePct}% (${hasImg ? 'text+picto' : 'text-only'})`);
        }
        
        // Validate font size percentage
        if (!baseFontSizePct || baseFontSizePct <= 0) {
            baseFontSizePct = hasImg ? 15 : 35; // Fallback values
            console.warn(`⚠️ Invalid font size percentage, using fallback: ${baseFontSizePct}%`);
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
        const fontSizePx = fontUtil.pctToPx(baseFontSizePct, containerSize);
        let fontSizeMM = fontSizePx * PX_TO_MM;
        let fontSizePt = Math.max(fontSizeMM / 0.352778, 6);
        
        console.log(`📏 Final font size calculation for element ${element.id}:`);
        console.log(`  - Base percentage: ${baseFontSizePct}%`);
        console.log(`  - Container size: ${currentWidth}x${currentHeight}mm`);
        console.log(`  - Calculated font size: ${fontSizePx}px (${fontSizeMM}mm, ${fontSizePt}pt)`);
        
        // Ensure minimum font size for readability
        if (fontSizePt < 6) {
            fontSizePt = 6;
            fontSizeMM = fontSizePt * 0.352778;
            console.log(`  - Adjusted to minimum font size: ${fontSizePt}pt`);
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
        console.error('Error adding label to PDF:', error);
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
            console.warn('Error loading image for element:', element.id, error);
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
            console.warn('Error getting image dimensions for element:', element.id, error);
            return Promise.resolve();
        }
    }
    
    if (!dim || !dim.ratio || isNaN(dim.ratio)) {
        console.warn('Invalid image dimensions for element:', element.id);
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
        console.warn('Error adding image to PDF for element:', element.id, error);
        }
    } catch (error) {
        console.error('Error in addImageToPdf:', error);
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
        console.error('Error loading font:', error);
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
            if (pdfOptions.verbose) {
                console.log('Updated pdfOptions:', JSON.stringify(pdfOptions, null, 2));
            }
        } else {
            console.warn('Incomplete metadata in getMetadataConfig, applying defaults:', metadata);
            pdfOptions.textPadding = pdfOptions.textPadding ?? 3;
            pdfOptions.elementMargin = pdfOptions.elementMargin ?? 0.15;
            pdfOptions.fontFamily = pdfOptions.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = pdfOptions.borderWidth ?? 1;
            pdfOptions.borderRadius = pdfOptions.borderRadius ?? 0;
        }
                } catch (error) {
            console.error('Error updating metadata config:', error);
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
    console.log(`PDF Service verbose mode: ${verbose ? 'enabled' : 'disabled'}`);
};

printService.setUsePDF = function(usePDF) {
    pdfOptions.usePDF = usePDF;
    console.log(`PDF Service usePDF: ${usePDF ? 'enabled' : 'disabled'}`);
};

printService.getOptions = function() {
    return { ...pdfOptions };
};

// NEW: Function to enable UI-to-PDF synchronization debugging
printService.enableUISyncDebug = function() {
    pdfOptions.verbose = true;
    pdfOptions.usePDF = true;
    console.log('🔍 UI-to-PDF synchronization debugging enabled');
    console.log('   - Verbose mode: enabled');
    console.log('   - UI validation: enabled');
    console.log('   - This will show detailed comparison between UI and PDF values');
};

// NEW: Function to disable UI-to-PDF synchronization debugging
printService.disableUISyncDebug = function() {
    pdfOptions.verbose = false;
    console.log('🔍 UI-to-PDF synchronization debugging disabled');
};

// Initialize with reasonable defaults
printService.setVerbose(false);
printService.setUsePDF(true);
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