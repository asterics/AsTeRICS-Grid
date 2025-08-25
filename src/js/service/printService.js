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
    footerHeight: 8,
    textPadding: null,
    elementMargin: null,
    imgMargin: 1,
    imgHeightPercentage: 0.8,
    fontFamily: null,
    borderWidth: null,
    borderRadius: null
};

// Global variables for metadata configuration
let convertMode = null;

function updatePdfOptionsFromMetadata(metadata) {
    console.log('🔧 Updating PDF options from metadata:', {
        metadataElementMargin: metadata?.colorConfig?.elementMargin,
        metadataTextPadding: metadata?.textConfig?.textPadding,
        metadataFontFamily: metadata?.textConfig?.fontFamily,
        metadataBorderWidth: metadata?.colorConfig?.borderWidth,
        metadataBorderRadius: metadata?.colorConfig?.borderRadius
    });

    const missingFields = [];

    if (metadata?.colorConfig?.elementMargin != null) {
        pdfOptions.elementMargin = metadata.colorConfig.elementMargin / 100;
        console.log(`🔧 Updated elementMargin: ${metadata.colorConfig.elementMargin}% → ${pdfOptions.elementMargin}`);
    } else {
        pdfOptions.elementMargin = 0.005;
        missingFields.push('colorConfig.elementMargin');
    }

    if (metadata?.textConfig?.textPadding != null) {
        pdfOptions.textPadding = metadata.textConfig.textPadding;
        console.log(`🔧 Updated textPadding: ${metadata.textConfig.textPadding}mm`);
    } else {
        pdfOptions.textPadding = 3;
        missingFields.push('textConfig.textPadding');
    }

    if (metadata?.textConfig?.fontFamily != null) {
        pdfOptions.fontFamily = metadata.textConfig.fontFamily;
        console.log(`🔧 Updated fontFamily: ${pdfOptions.fontFamily}`);
    } else {
        pdfOptions.fontFamily = 'Jost-400-Book';
        missingFields.push('textConfig.fontFamily');
    }

    if (metadata?.colorConfig?.borderWidth != null) {
        pdfOptions.borderWidth = metadata.colorConfig.borderWidth;
        console.log(`🔧 Updated borderWidth: ${pdfOptions.borderWidth}%`);
    } else {
        pdfOptions.borderWidth = 1;
        missingFields.push('colorConfig.borderWidth');
    }

    if (metadata?.colorConfig?.borderRadius != null) {
        pdfOptions.borderRadius = metadata.colorConfig.borderRadius;
        console.log(`🔧 Updated borderRadius: ${pdfOptions.borderRadius}%`);
    } else {
        pdfOptions.borderRadius = 0;
        missingFields.push('colorConfig.borderRadius');
    }

    if (missingFields.length > 0) {
        console.warn(`⚠️ Missing metadata fields, using defaults: ${missingFields.join(', ')}`);
        console.log('Metadata received:', JSON.stringify(metadata, null, 2));
    }

    console.log('🔧 Final PDF options:', JSON.stringify(pdfOptions, null, 2));
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

        let metadata = await dataService.getMetadata() || { colorConfig: {}, textConfig: {} };
        console.log('Initial metadata:', JSON.stringify(metadata, null, 2));

        try {
            if (typeof MetaData !== 'undefined' && MetaData.getCurrentMetaData) {
                const alternativeMetadata = MetaData.getCurrentMetaData();
                if (alternativeMetadata && alternativeMetadata.colorConfig &&
                    Object.keys(alternativeMetadata.colorConfig).length > Object.keys(metadata.colorConfig).length) {
                    metadata = alternativeMetadata;
                    console.log('Using alternative metadata:', JSON.stringify(metadata, null, 2));
                }
            }
        } catch (e) {
            console.warn('Could not access MetaData.getCurrentMetaData:', e);
        }

        updatePdfOptionsFromMetadata(metadata);

        const defaultGlobalGrid = options.includeGlobalGrid ? await dataService.getGlobalGrid() : null;

        options.idPageMap = {};
        options.idParentsMap = {};
        options.customFontFamily = pdfOptions.fontFamily;

        gridsData.forEach((grid, index) => {
            options.idPageMap[grid.id] = index + 1;
        });

        for (let grid of gridsData) {
            options.idParentsMap[grid.id] = options.idParentsMap[grid.id] || [];
            for (let element of grid.gridElements) {
                element = new GridElement(element);
                let nav = element.getNavigateGridId();
                if (nav) {
                    options.idParentsMap[nav] = options.idParentsMap[nav] || [];
                    options.idParentsMap[nav].push(options.idPageMap[grid.id]);
                }
                let label = i18nService.getTranslation(element.label);
                // Skip pattern font mapping to avoid 404 errors
                // We'll use built-in fonts instead
            }
        }

        const doc = new jsPDF.jsPDF({ orientation: 'landscape', unit: 'mm', compress: true });

        // Try to use the user's configured font family if it's a built-in font
        const userFontFamily = pdfOptions.fontFamily;
        const builtInFonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Courier New', 'Times New Roman'];
        
        let fontLoaded = false;
        let loadedFontName = 'Helvetica'; // Default fallback
        
        // First, try the user's configured font if it's built-in
        if (builtInFonts.includes(userFontFamily)) {
            try {
                doc.setFont(userFontFamily);
                if (doc.getTextWidth('Test') > 0) {
                    options.loadedCustomFont = userFontFamily;
                    fontLoaded = true;
                    loadedFontName = userFontFamily;
                    console.log(`✅ Using built-in font: ${userFontFamily}`);
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
                        console.log(`✅ Using built-in font: ${fontName}`);
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

            metadata = await dataService.getMetadata() || { colorConfig: {}, textConfig: {} };
            console.log('Metadata for page', i + 1, ':', JSON.stringify(metadata, null, 2));

            try {
                if (typeof MetaData !== 'undefined' && MetaData.getCurrentMetaData) {
                    const alternativeMetadata = MetaData.getCurrentMetaData();
                    if (alternativeMetadata && alternativeMetadata.colorConfig &&
                        Object.keys(alternativeMetadata.colorConfig).length > Object.keys(metadata.colorConfig).length) {
                        metadata = alternativeMetadata;
                        console.log('Using alternative metadata for page', i + 1, ':', JSON.stringify(metadata, null, 2));
                    }
                }
            } catch (e) {
                console.warn('Could not access MetaData.getCurrentMetaData:', e);
            }

            updatePdfOptionsFromMetadata(metadata);

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

        if (metadata?.colorConfig?.gridBackgroundColor) {
            // Set grid background color
            if (metadata?.colorConfig?.gridBackgroundColor) {
                const rgb = colorToRGB(metadata.colorConfig.gridBackgroundColor);
                doc.setFillColor(...rgb);
                doc.rect(0, 0, DOC_WIDTH, DOC_HEIGHT, 'F');
            }
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

        if (hasARASAACImages) {
            doc.setFillColor(90, 113, 122);
            doc.rect(0, DOC_HEIGHT - footerHeight, DOC_WIDTH, footerHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.text(
                'ARASAAC - ARASAAC.org',
                DOC_WIDTH / 2,
                DOC_HEIGHT - footerHeight / 2,
                { baseline: 'middle', align: 'center' }
            );
        }

        for (const element of gridData.gridElements) {
            if (element.hidden) continue;

            const colorConfig = metadata?.colorConfig || {};
            const useElementColors = options.printElementColors !== false;
            const colorMode = colorConfig.colorMode || ColorConfig.COLOR_MODE_BACKGROUND;
            const shouldDrawBorder = colorMode === ColorConfig.COLOR_MODE_BORDER || colorMode === ColorConfig.COLOR_MODE_BOTH;
            const shouldDrawBackground = colorMode === ColorConfig.COLOR_MODE_BACKGROUND || colorMode === ColorConfig.COLOR_MODE_BOTH;

            // Calculate element margin using the same logic as UI
            const elementMargin = pdfOptions.elementMargin;
            // Use the same conversion logic as fontUtil.pctToPx() - based on height like UI
            const elementMarginMM = elementMargin * elementTotalHeight;

            const currentWidth = elementTotalWidth * element.width - 2 * elementMarginMM;
            const currentHeight = elementTotalHeight * element.height - 2 * elementMarginMM;
            const xStartPos = pdfOptions.docPadding + elementTotalWidth * element.x + elementMarginMM;
            const yStartPos = pdfOptions.docPadding + elementTotalHeight * element.y + elementMarginMM;

            // Get background color using the same logic as UI
            let bgColor = [255, 255, 255];
            if (useElementColors && shouldDrawBackground && options.printBackground) {
                try {
                    // Use the exact same logic as util.getElementBackgroundColor
                    if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                        bgColor = colorToRGB(constants.COLORS.PREDICT_BACKGROUND);
                    } else if (element.type === GridElement.ELEMENT_TYPE_LIVE) {
                        bgColor = colorToRGB(element.backgroundColor || constants.COLORS.LIVE_BACKGROUND);
                    } else if (colorConfig.colorSchemesActivated && element.colorCategory) {
                        // Use color scheme logic
                        let colorScheme = MetaData.getUseColorScheme(metadata);
                        if (colorScheme) {
                            let index = colorScheme.categories.indexOf(element.colorCategory);
                            if (index === -1 && colorScheme.mappings) {
                                let mapped = colorScheme.mappings[element.colorCategory];
                                index = colorScheme.categories.indexOf(mapped);
                            }
                            if (index !== -1) {
                                bgColor = colorToRGB(colorScheme.colors[index]);
                            } else {
                                bgColor = colorToRGB(colorConfig.elementBackgroundColor || constants.DEFAULT_ELEMENT_BACKGROUND_COLOR);
                            }
                        }
                    } else if ([ColorConfig.COLOR_MODE_BACKGROUND, ColorConfig.COLOR_MODE_BOTH].includes(colorConfig.colorMode)) {
                        bgColor = colorToRGB(MetaData.getElementColor(element, metadata));
                    } else {
                        bgColor = colorToRGB(colorConfig.elementBackgroundColor || constants.DEFAULT_ELEMENT_BACKGROUND_COLOR);
                    }
                } catch (error) {
                    console.warn('Error getting background color for element:', element.id, error);
                    bgColor = colorToRGB(constants.DEFAULT_ELEMENT_BACKGROUND_COLOR);
                }
            }

            // Get border color using the exact same logic as UI
            let borderColor = [0, 0, 0];
            if (useElementColors && shouldDrawBorder) {
                try {
                    // Use the exact same logic as util.getElementBorderColor
                    let color = colorConfig.elementBorderColor;
                    
                    // Handle default border color with high contrast
                    if (color === constants.DEFAULT_ELEMENT_BORDER_COLOR) {
                        let backgroundColor = colorConfig.gridBackgroundColor || constants.COLORS.WHITE;
                        color = fontUtil.getHighContrastColor(backgroundColor, constants.COLORS.WHITESMOKE, constants.COLORS.GRAY);
                    }
                    
                    if (colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER) {
                        color = MetaData.getElementColor(element, metadata, color);
                    } else if (colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH) {
                        if (!element.colorCategory) {
                            color = 'transparent';
                        } else {
                            let colorScheme = MetaData.getUseColorScheme(metadata);
                            if (colorScheme && colorScheme.customBorders && colorScheme.customBorders[element.colorCategory]) {
                                color = colorScheme.customBorders[element.colorCategory];
                            } else {
                                // Use the same border color logic as UI for COLOR_MODE_BOTH
                                let absAdjustment = 40;
                                let bgColorForBorder = MetaData.getElementColor(element, metadata, color);
                                let adjustment = fontUtil.isHexDark(bgColorForBorder) ? absAdjustment * 1.5 : absAdjustment * -1;
                                color = fontUtil.adjustHexColor(bgColorForBorder, adjustment);
                            }
                        }
                    }
                    
                    borderColor = colorToRGB(color);
                } catch (error) {
                    console.warn('Error getting border color for element:', element.id, error);
                    borderColor = colorToRGB(constants.DEFAULT_ELEMENT_BORDER_COLOR);
                }
            }

            // Convert percentages to measurements using the same logic as UI
            const borderWidth = pdfOptions.borderWidth;
            // Use the same conversion logic as fontUtil.pctToPx() - based on height like UI
            let borderWidthMM = (borderWidth / 100) * currentHeight;
            if (borderWidth > 0 && borderWidthMM < 0.05) {
                borderWidthMM = 0.05;
            }

            const borderRadius = pdfOptions.borderRadius;
            // Use the same conversion logic as fontUtil.pctToPx() - based on height like UI
            let borderRadiusMM = (borderRadius / 100) * currentHeight;

            const uiElement = $(`#${element.id}`);
            if (uiElement.length) {
                const uiBorderWidthPx = parseFloat(uiElement.css('border-width')) || 0;
                const uiBorderWidthMM = uiBorderWidthPx * PX_TO_MM;
                const uiBorderRadiusPx = parseFloat(uiElement.css('border-radius')) || 0;
                const uiBorderRadiusMM = uiBorderRadiusPx * PX_TO_MM;
                const uiMarginPx = parseFloat(uiElement.css('margin')) || 0;
                const uiMarginMM = uiMarginPx * PX_TO_MM;
                const uiBgColor = uiElement.css('background-color');
                const uiBorderColor = uiElement.css('border-color');

                if (Math.abs(uiBorderWidthMM - borderWidthMM) > 0.02) {
                    console.warn(`Border width mismatch for element ${element.id}: UI=${uiBorderWidthMM}mm (${uiBorderWidthPx}px), PDF=${borderWidthMM}mm`);
                }
                if (Math.abs(uiBorderRadiusMM - borderRadiusMM) > 0.02) {
                    console.warn(`Border radius mismatch for element ${element.id}: UI=${uiBorderRadiusMM}mm (${uiBorderRadiusPx}px), PDF=${borderRadiusMM}mm`);
                }
                if (Math.abs(uiMarginMM - elementMarginMM) > 0.02) {
                    console.warn(`Margin mismatch for element ${element.id}: UI=${uiMarginMM}mm (${uiMarginPx}px), PDF=${elementMarginMM}mm`);
                }
                if (uiBgColor && colorToRGB(uiBgColor).join(',') !== bgColor.join(',')) {
                    console.warn(`Background color mismatch for element ${element.id}: UI=${uiBgColor}, PDF=${bgColor}`);
                }
                if (uiBorderColor && colorToRGB(uiBorderColor).join(',') !== borderColor.join(',')) {
                    console.warn(`Border color mismatch for element ${element.id}: UI=${uiBorderColor}, PDF=${borderColor}`);
                }
            }

            doc.setFillColor(...bgColor);
            doc.setDrawColor(...borderColor);
            doc.setLineWidth(borderWidthMM);

            if (borderRadiusMM > 0) {
                doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, 'F');
                if (shouldDrawBorder && borderWidthMM > 0) {
                    doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, 'D');
                }
            } else {
                doc.rect(xStartPos, yStartPos, currentWidth, currentHeight, 'F');
                if (shouldDrawBorder && borderWidthMM > 0) {
                    doc.rect(xStartPos, yStartPos, currentWidth, currentHeight, 'D');
                }
            }

            if (i18nService.getTranslation(element.label)) {
                await addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors, options);
            }
            await addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, metadata);

            if (options.showLinks && element.type === GridElement.ELEMENT_TYPE_NAVIGATE) {
                let targetGridId = element.getNavigateGridId();
                if (targetGridId && options.idPageMap[targetGridId]) {
                    let targetPage = options.idPageMap[targetGridId];
                    let iconWidth = Math.min(currentWidth, currentHeight) * 0.2;
                    let offsetX = currentWidth - iconWidth - 2;
                    let offsetY = 2;
                    doc.setDrawColor(255);
                    doc.setFillColor(90, 113, 122);
                    doc.roundedRect(xStartPos + offsetX, yStartPos + offsetY, iconWidth, iconWidth, 1, 1, 'FD');
                    doc.link(xStartPos, yStartPos, currentWidth, currentHeight, { pageNumber: targetPage });
                    if (targetPage) {
                        let fontSizePt = (iconWidth * 0.6) / 0.352778;
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
                }
            }
        }
    } catch (error) {
        console.error('Error in addGridToPdf:', error);
        throw error;
    }
}

async function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors = true, options) {
    try {
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

        // Use the exact same font logic as the UI
        let fontFamily = textConfig.fontFamily || 'Arial';
        
        // Map custom fonts to built-in equivalents for jsPDF compatibility
        const fontMapping = {
            'Jost-400-Book': 'Arial',
            'Roboto-Regular': 'Arial', 
            'OpenDyslexic-Regular': 'Arial',
            'Times': 'Times',
            'Arial': 'Arial'
        };
        
        // Use mapped font or fallback to Arial
        fontFamily = fontMapping[fontFamily] || 'Arial';
        doc.setFont(fontFamily);

        const uiElement = $(`#${element.id}`);
        let uiFontSizeMM = 0;
        let uiFontSizePx = 0;
        let textColor = [0, 0, 0];

        if (uiElement.length) {
            const uiFontFamily = uiElement.css('font-family').replace(/['"]/g, '');
            uiFontSizePx = parseFloat(uiElement.css('font-size')) || 16;
            uiFontSizeMM = uiFontSizePx * 0.264583;
            const uiTextColor = uiElement.css('color');

            if (uiFontFamily !== fontFamily) {
                console.warn(`Font family mismatch for element ${element.id}: UI=${uiFontFamily}, PDF=${fontFamily}`);
            }
            if (uiTextColor && colorToRGB(uiTextColor).join(',') !== textColor.join(',')) {
                console.warn(`Text color mismatch for element ${element.id}: UI=${uiTextColor}, PDF=${textColor}`);
            }
        } else {
            console.warn(`UI element not found for ${element.id}. Cannot validate font or text color.`);
        }

        const baseFontSizePct = hasImg ? (textConfig.fontSizePct || 30) : (textConfig.onlyTextFontSizePct || 40);
        const lineHeight = hasImg ? (textConfig.lineHeight || 1.2) : (textConfig.onlyTextLineHeight || 1.2);
        const maxLines = hasImg ? (textConfig.maxLines || 2) : 100;
        const fittingMode = textConfig.fittingMode || TextConfig.TOO_LONG_AUTO;

        let fontSizeMM = currentHeight * (baseFontSizePct / 100);
        let fontSizePt = Math.max(fontSizeMM / 0.352778, 6);

        if (uiElement.length && Math.abs(uiFontSizeMM - fontSizeMM) > 0.02) {
            console.warn(`Font size mismatch for element ${element.id}: UI=${uiFontSizeMM}mm (${uiFontSizePx}px), PDF=${fontSizeMM}mm`);
            fontSizeMM = uiFontSizeMM;
            fontSizePt = fontSizeMM / 0.352778;
        }

        const maxWidth = currentWidth - 2 * pdfOptions.textPadding;
        const maxHeight = currentHeight - 2 * pdfOptions.textPadding;
        const effectiveMaxHeight = Math.min(maxHeight, (fontSizePt * 0.352778) * lineHeight * maxLines);

        // Use the exact same text color logic as the UI
        if (useElementColors) {
            try {
                // Use the exact same logic as util.getElementFontColor
                let fontColor = textConfig.fontColor;
                if (!fontColor || [constants.COLORS.BLACK, constants.COLORS.WHITE].includes(fontColor)) {
                    // if not set or set to black or white - do auto-contrast
                    let backgroundColor = bgColor.join(',');
                    textColor = fontUtil.isHexDark(backgroundColor) ? colorToRGB(constants.COLORS.WHITE) : colorToRGB(constants.COLORS.BLACK);
                } else {
                    textColor = colorToRGB(fontColor);
                }
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

        if (!fits && fittingMode === TextConfig.TOO_LONG_AUTO) {
            const step = actualFontSize / 20;
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
                dim = doc.getTextDimensions(test);
                if (dim.w > maxWidth) break;
                truncated = test;
            }
            displayLabel = truncated;
        } else if (!fits && fittingMode === TextConfig.TOO_LONG_ELLIPSIS) {
            let truncated = '';
            for (let i = 0; i < displayLabel.length; i++) {
                const test = truncated + displayLabel[i] + '...';
                dim = doc.getTextDimensions(test);
                if (dim.w > maxWidth) break;
                truncated += displayLabel[i];
            }
            displayLabel = truncated + '...';
        }

        doc.setFontSize(actualFontSize);

        const textPosition = textConfig.textPosition;
        const xOffset = xStartPos + currentWidth / 2;
        let yOffset = hasImg
            ? textPosition === TextConfig.TEXT_POS_ABOVE
                ? yStartPos + pdfOptions.textPadding + dim.h / 2
                : yStartPos + currentHeight - pdfOptions.textPadding - dim.h / 2
            : yStartPos + currentHeight / 2;

        doc.text(displayLabel, xOffset, yOffset, {
            baseline: 'middle',
            align: 'center',
            maxWidth
        });
    } catch (error) {
        console.error('Error adding label to PDF:', error);
        throw error;
    }
}

async function addImageToPdf(doc, element, elementWidth, elementHeight, xpos, ypos, metadata) {
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

        let maxWidth = elementWidth - 2 * pdfOptions.imgMargin;
        let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin - imageTopOffset) * imgHeightPercentage;

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

        let x = xpos + pdfOptions.imgMargin + xOffset;
        let y = ypos + pdfOptions.imgMargin + yOffset;

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
        console.log('getMetadataConfig metadata:', JSON.stringify(metadata, null, 2));
        if (metadata.textConfig && metadata.colorConfig) {
            convertMode = metadata.textConfig.convertMode;
            pdfOptions.textPadding = metadata.textConfig.textPadding ?? 3;
            pdfOptions.elementMargin = metadata.colorConfig.elementMargin ? metadata.colorConfig.elementMargin / 100 : 0.005;
            pdfOptions.fontFamily = metadata.textConfig.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = metadata.colorConfig.borderWidth ?? 1;
            pdfOptions.borderRadius = metadata.colorConfig.borderRadius ?? 0;
            console.log('Updated pdfOptions:', JSON.stringify(pdfOptions, null, 2));
        } else {
            console.warn('Incomplete metadata in getMetadataConfig, applying defaults:', metadata);
            pdfOptions.textPadding = pdfOptions.textPadding ?? 3;
            pdfOptions.elementMargin = pdfOptions.elementMargin ?? 0.005;
            pdfOptions.fontFamily = pdfOptions.fontFamily ?? 'Jost-400-Book';
            pdfOptions.borderWidth = pdfOptions.borderWidth ?? 1;
            pdfOptions.borderRadius = pdfOptions.borderRadius ?? 0;
        }
    } catch (error) {
        console.error('Error updating metadata config:', error);
        pdfOptions.textPadding = pdfOptions.textPadding ?? 3;
        pdfOptions.elementMargin = pdfOptions.elementMargin ?? 0.005;
        pdfOptions.fontFamily = pdfOptions.fontFamily ?? 'Jost-400-Book';
        pdfOptions.borderWidth = pdfOptions.borderWidth ?? 1;
        pdfOptions.borderRadius = pdfOptions.borderRadius ?? 0;
    }
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
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