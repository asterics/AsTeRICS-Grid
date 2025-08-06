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
    textPadding: 3, // Increased from 2 to 3 for better text spacing
    elementMargin: 0.5, // Reduced for better spacing
    imgMargin: 1,
    imgHeightPercentage: 0.8
};
let convertMode = null;

let patternFontMappings = [
    {
        pattern: /^[\u0400-\u04FF]+$/,
        font: '/app/fonts/Arimo-Regular-Cyrillic.ttf'
    }
];

/**
 * Converts a color to RGB array format
 * @param {String|Array} color - Hex string or RGB array
 * @returns {Array} RGB array
 */
function colorToRGB(color) {
    if (Array.isArray(color)) {
        return color;
    } else if (typeof color === 'string' && color.startsWith('#')) {
        return util.hexToRgb(color);
    } else {
        return [0, 0, 0]; // fallback to black
    }
}

printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        // Store original dimensions
        const originalWidth = $('#grid-container').width();
        const originalHeight = $('#grid-container').height();
        
        // Set print-optimized dimensions to prevent cutoff
        $('#grid-container').width('27.7cm');
        $('#grid-container').height('19cm');
        
        // Store for cleanup
        window._printOriginalDimensions = { width: originalWidth, height: originalHeight };
    });
    
    window.addEventListener('afterprint', () => {
        // Restore original dimensions
        if (window._printOriginalDimensions) {
            $('#grid-container').width(window._printOriginalDimensions.width);
            $('#grid-container').height(window._printOriginalDimensions.height);
            delete window._printOriginalDimensions;
        }
    });
};

/**
 * Converts given grids to pdf and downloads the pdf file
 *
 * @param gridsData array of GridData to convert to pdf
 * @param options (optional) object containing options
 * @param options.showLinks if true, links on elements are created which are referring to another grid/page
 * @param options.backgroundColor object with r/g/b properties defining a background color for grid elements. Default: white.
 * @param options.includeGlobalGrid if true, the global grid is included to each grid
 * @param options.progressFn a function that is called in order to report progress of the task.
 *                           Parameters passed: <percentage:Number, text:String, abortFn:Function>.
 *                           "abortFn" can be called in order to abort the task.
 * @return {Promise<void>}
 */
printService.gridsToPdf = async function (gridsData, options) {
    let jsPDF = await import(/* webpackChunkName: "jspdf" */ 'jspdf');
    options = options || {};
    let metadata = await dataService.getMetadata();
    let defaultGlobalGrid = null;
    if (options.includeGlobalGrid) {
        defaultGlobalGrid = await dataService.getGlobalGrid();
    }
    options.idPageMap = {};
    options.idParentsMap = {};
    options.fontPath = '';
    options.customFontFamily = null;
    
    // Check if metadata has a custom font family configured
    if (metadata && metadata.textConfig && metadata.textConfig.fontFamily) {
        options.customFontFamily = metadata.textConfig.fontFamily;
    }
    
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
            for (let elem of patternFontMappings) {
                if (elem.pattern && elem.pattern.test && elem.pattern.test(label)) {
                    options.fontPath = elem.font;
                }
            }
        }
    }
    const doc = new jsPDF.jsPDF({
        orientation: 'landscape',
        compress: true
    });
    
    // Load custom font if specified in metadata
    if (options.customFontFamily && options.customFontFamily !== 'Arial') {
        console.log('Attempting to load custom font:', options.customFontFamily);
        let fontLoaded = false;
        
        // Map font names to file names
        let fontNameMapping = {
            'Roboto-Regular': 'Roboto-Regular',
            'OpenDyslexic-Regular': 'OpenDyslexic-Regular', 
            'Jost-400-Book': 'Jost-400-Book',
            'Times': 'Times'
        };
        
        let fontFileName = fontNameMapping[options.customFontFamily] || options.customFontFamily;
        let fontPaths = [
            `/app/fonts/${fontFileName}.ttf`,
            `/app/fonts/${fontFileName}.otf`,
            `/fonts/${fontFileName}.ttf`,
            `/fonts/${fontFileName}.otf`,
            `./fonts/${fontFileName}.ttf`,
            `./fonts/${fontFileName}.otf`,
            // Try with different naming conventions
            `/app/fonts/${fontFileName.toLowerCase()}.ttf`,
            `/app/fonts/${fontFileName.toLowerCase()}.otf`,
            `/fonts/${fontFileName.toLowerCase()}.ttf`,
            `/fonts/${fontFileName.toLowerCase()}.otf`
        ];
        
        for (let fontPath of fontPaths) {
            try {
                console.log('Trying font path:', fontPath);
                await loadFont(fontPath, doc);
                fontLoaded = true;
                console.info('Successfully loaded custom font:', options.customFontFamily, 'from:', fontPath);
                break;
            } catch (error) {
                console.warn('Could not load font from path:', fontPath, error);
                // Try next path
            }
        }
        
        if (!fontLoaded) {
            console.warn('Could not load custom font:', options.customFontFamily, '- will use Arial as fallback');
            // Try to use built-in fonts if available
            if (options.customFontFamily === 'Times') {
                try {
                    doc.setFont('Times');
                    console.log('Using built-in Times font');
                } catch (error) {
                    console.warn('Times font not available, using Arial');
                }
            }
        } else {
            console.log('Custom font loaded successfully, available fonts in doc:', doc.getFont().fontName);
        }
    }
    
    // Load pattern-based font if needed
    if (options.fontPath) {
        await loadFont(options.fontPath, doc);
    }
    
    // Log available fonts for debugging
    logAvailableFonts(doc);

    options.pages = gridsData.length;
    for (let i = 0; i < gridsData.length && !options.abort; i++) {
        if (options.progressFn) {
            options.progressFn(
                Math.round((100 * i) / gridsData.length),
                i18nService.t('creatingPageXOfY', i + 1, gridsData.length),
                () => {
                    options.abort = true;
                }
            );
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
        if (options.progressFn) {
            options.progressFn(100);
        }
        doc.save('grids_' + util.getCurrentDateTimeString() + '.pdf');
    }
};

async function addGridToPdf(doc, gridData, options, metadata, globalGrid) {
    let promises = [];
    let DOC_WIDTH = 297;
    let DOC_HEIGHT = 210;

    gridData = new GridData(gridData);
    
    // Add error handling for grid merging
    try {
        gridData = gridUtil.mergeGrids(gridData, globalGrid, metadata);
    } catch (error) {
        console.warn('Error merging grids, continuing without global grid:', error);
        // Continue without global grid if merging fails
    }
    let hasARASAACImages = gridData.gridElements.reduce(
        (total, element) =>
            total || (element.image && element.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME),
        false
    );
    let registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
    let footerHeight = hasARASAACImages ? 2 * pdfOptions.footerHeight : pdfOptions.footerHeight;
    
    // Add safety checks for grid dimensions
    let gridWidth = gridUtil.getWidthWithBounds(gridData);
    let gridHeight = gridUtil.getHeightWithBounds(gridData);
    
    // Prevent division by zero
    if (gridWidth <= 0) gridWidth = 1;
    if (gridHeight <= 0) gridHeight = 1;
    
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridWidth;
    let elementTotalHeight = (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight) / gridHeight;
    if (footerHeight > 0) {
        let yBaseFooter = DOC_HEIGHT - pdfOptions.docPadding - registerHeight;
        let fontSizePt = (pdfOptions.footerHeight * 0.4) / 0.352778;
        doc.setTextColor(0);
        doc.setFontSize(fontSizePt);
        let textL = i18nService.t('printedByAstericsGrid');
        let textL2 = i18nService.t('copyrightARASAACPDF');
        let textC = i18nService.getTranslation(gridData.label);
        let firstParentPage = options.idParentsMap[gridData.id][0];
        let yLine1 = hasARASAACImages ? yBaseFooter - pdfOptions.footerHeight : yBaseFooter;
        if (options.showLinks && firstParentPage) {
            let prefix = JSON.stringify(options.idParentsMap[gridData.id].slice(0, 5));
            textC = prefix + ' => ' + textC;
            let textWidth = doc.getTextWidth(textC);
            doc.link(
                DOC_WIDTH / 2 - textWidth / 2,
                yLine1 - pdfOptions.footerHeight * 0.4,
                textWidth,
                pdfOptions.footerHeight * 0.4,
                { pageNumber: firstParentPage }
            );
        }
        let currentPage = options.idPageMap[gridData.id] || 1;
        let totalPages = Object.keys(options.idPageMap).length || 1;
        let textR = currentPage + ' / ' + totalPages;
        doc.text(textL, pdfOptions.docPadding + pdfOptions.elementMargin, yLine1, {
            baseline: 'bottom',
            align: 'left'
        });
        if (hasARASAACImages) {
            doc.text(textL2, pdfOptions.docPadding + pdfOptions.elementMargin, yBaseFooter, {
                baseline: 'bottom',
                align: 'left'
            });
        }
        doc.text(textC, DOC_WIDTH / 2, yLine1, {
            baseline: 'bottom',
            align: 'center'
        });
        doc.text(textR, DOC_WIDTH - pdfOptions.docPadding - pdfOptions.elementMargin, yLine1, {
            baseline: 'bottom',
            align: 'right'
        });
    }
    if (registerHeight > 0) {
        let maxRegisters = 30;
        let stepSize = 1;
        let registerCount = options.pages;
        if (options.pages > maxRegisters) {
            stepSize = Math.ceil(options.pages / maxRegisters);
            registerCount = Math.ceil(options.pages / stepSize);
        }
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0);
        doc.roundedRect(0, DOC_HEIGHT - registerHeight, DOC_WIDTH, registerHeight, 0, 0);
        doc.setFontSize(13);
        let registerElementWidth = DOC_WIDTH / registerCount;
        for (let i = 0; i < registerCount; i++) {
            doc.roundedRect(
                i * registerElementWidth,
                DOC_HEIGHT - registerHeight,
                registerElementWidth,
                registerHeight,
                0,
                0
            );
            let maxPage = i * stepSize + 1;
            if (maxPage <= options.page) {
                doc.text(
                    maxPage + '',
                    i * registerElementWidth + registerElementWidth / 2,
                    DOC_HEIGHT - registerHeight / 2,
                    {
                        baseline: 'middle',
                        align: 'center'
                    }
                );
            }
        }
    }
    for (let element of gridData.gridElements) {
        if (element.hidden) {
            continue;
        }
        
        // --- Cell Formatting ---
        let colorConfig = metadata && metadata.colorConfig ? metadata.colorConfig : {};
        // Print element colors option
        let useElementColors = options.printElementColors !== false;
        
        // Color mode handling - fix the logic for border/background modes
        let colorMode = colorConfig.colorMode || ColorConfig.COLOR_MODE_BACKGROUND;
        let onlyBorderMode = colorMode === ColorConfig.COLOR_MODE_BORDER;
        let onlyBackgroundMode = colorMode === ColorConfig.COLOR_MODE_BACKGROUND;
        let bothMode = colorMode === ColorConfig.COLOR_MODE_BOTH;
        
        // Get proper spacing from metadata
        let elementMargin = colorConfig.elementMargin || 0;
        let elementMarginMM = (elementMargin / 100) * Math.min(elementTotalWidth, elementTotalHeight);
        let actualElementMargin = Math.max(elementMarginMM, pdfOptions.elementMargin);
        
        let bgColor = [255, 255, 255]; // Default white background
        // Apply background color based on color mode
        if (useElementColors && (onlyBackgroundMode || bothMode) && options.printBackground) {
            try {
                let elementBgColor = util.getElementBackgroundColor(element, metadata);
                let rgbColor = util.getRGB(elementBgColor);
                if (rgbColor && Array.isArray(rgbColor) && rgbColor.length === 3) {
                    bgColor = rgbColor;
                }
            } catch (error) {
                console.warn('Error processing background color for element:', element.id, error);
                // Keep default white background
            }
        }
        
        let borderColor = [0, 0, 0]; // Default black border
        // Apply border color based on color mode
        if (useElementColors && (onlyBorderMode || bothMode)) {
            try {
                let elementBorderColor = util.getElementBorderColor(element, metadata);
                let rgbBorderColor = util.getRGB(elementBorderColor);
                if (rgbBorderColor && Array.isArray(rgbBorderColor) && rgbBorderColor.length === 3) {
                    borderColor = rgbBorderColor;
                }
            } catch (error) {
                console.warn('Error processing border color for element:', element.id, error);
                // Keep default black border
            }
        }
        
        // Border width and radius - use metadata values properly
        let borderWidth = colorConfig.borderWidth || 0.1;
        let borderRadius = colorConfig.borderRadius || 0.4;
        
        // Calculate cell dimensions with proper spacing
        let currentWidth = elementTotalWidth * element.width - 2 * actualElementMargin;
        let currentHeight = elementTotalHeight * element.height - 2 * actualElementMargin;
        
        // Ensure minimum cell size
        currentWidth = Math.max(currentWidth, 5);
        currentHeight = Math.max(currentHeight, 5);
        
        let xStartPos = pdfOptions.docPadding + elementTotalWidth * element.x + actualElementMargin;
        let yStartPos = pdfOptions.docPadding + elementTotalHeight * element.y + actualElementMargin;
        
        // Border thickness - convert percentage to mm properly
        let borderWidthMM = Math.max((borderWidth / 100) * Math.min(currentWidth, currentHeight), 0.2);
        let borderRadiusMM = Math.max((borderRadius / 100) * Math.min(currentWidth, currentHeight), 0.5);
        
        // Debug logging for border and spacing
        console.log('Element border config:', {
            colorMode: colorMode,
            onlyBorderMode: onlyBorderMode,
            onlyBackgroundMode: onlyBackgroundMode,
            bothMode: bothMode,
            borderWidth: borderWidth,
            borderWidthMM: borderWidthMM,
            borderRadius: borderRadius,
            borderRadiusMM: borderRadiusMM,
            elementMargin: elementMargin,
            actualElementMargin: actualElementMargin
        });
        
        // --- Draw cell ---
        let borderRgb = colorToRGB(borderColor);
        doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
        doc.setLineWidth(borderWidthMM);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        
        // Draw cell with proper border and background
        if (borderRadiusMM > 0.5) {
            // Draw rounded rectangle with proper border
            doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, 'FD');
        } else {
            // Draw regular rectangle
            doc.rect(xStartPos, yStartPos, currentWidth, currentHeight, 'FD');
        }
        
        // Debug logging for border drawing
        console.log('Drawing cell with:', {
            borderColor: borderColor,
            borderRgb: borderRgb,
            borderWidthMM: borderWidthMM,
            borderRadiusMM: borderRadiusMM,
            bgColor: bgColor,
            position: [xStartPos, yStartPos],
            size: [currentWidth, currentHeight]
        });
        
        // Add text if element has a label
        if (i18nService.getTranslation(element.label)) {
            addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors);
        }
        
        // Add image
        await addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, metadata);
        
        element = new GridElement(element);
        if (options.showLinks && options.idPageMap[element.getNavigateGridId()]) {
            let targetPage = options.idPageMap[element.getNavigateGridId()];
            let iconWidth = Math.max(currentWidth / 10, 7);
            let offsetX = currentWidth - iconWidth - 1;
            let offsetY = 1;
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
    return Promise.all(promises);
}

function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata, useElementColors = true) {
    // 1. Get label and apply convert mode
    let label = i18nService.getTranslation(element.label);
    if (!label || label.trim() === '') {
        return; // Don't render empty labels
    }
    
    let textConfig = metadata && metadata.textConfig ? metadata.textConfig : {};
    let hasImg = element.image && (element.image.data || element.image.url);
    
    // Debug: Log image detection
    console.log('Element image:', element.image);
    console.log('Element has image data:', element.image && element.image.data);
    console.log('Element has image url:', element.image && element.image.url);
    console.log('HasImg result:', hasImg);
    
    let convertMode = textConfig.convertMode;
    
    if (convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        label = label.toLocaleUpperCase();
    } else if (convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        label = label.toLocaleLowerCase();
    }
    
    // 2. Font family - ensure we have a valid font
    let fontFamily = textConfig.fontFamily || 'Arial';
    
    // Debug: Log the configured font family
    console.log('Element text config fontFamily:', textConfig.fontFamily);
    console.log('Using font family:', fontFamily);
    
    // Try to use the configured font family
    if (fontFamily && fontFamily !== 'Arial') {
        try {
            // Check if we can set the font - if it fails, it will throw an error
            doc.setFont(fontFamily);
            console.log('Successfully set font to:', fontFamily);
            // If we get here, the font is available
        } catch (error) {
            console.warn('Font not available, falling back to Arial:', fontFamily, error);
            // Try alternative font names
            let alternativeFonts = {
                'Roboto-Regular': 'Roboto',
                'OpenDyslexic-Regular': 'OpenDyslexic',
                'Jost-400-Book': 'Jost',
                'Times': 'Times'
            };
            
            let alternativeFont = alternativeFonts[fontFamily];
            if (alternativeFont) {
                try {
                    doc.setFont(alternativeFont);
                    console.log('Successfully set alternative font to:', alternativeFont);
                    fontFamily = alternativeFont;
                } catch (altError) {
                    console.warn('Alternative font also not available, using Arial:', alternativeFont, altError);
                    fontFamily = 'Arial';
                    doc.setFont(fontFamily);
                }
            } else {
                fontFamily = 'Arial';
                doc.setFont(fontFamily);
            }
        }
    } else {
        doc.setFont(fontFamily);
    }
    
    // 3. Font size calculation - improved sizing logic
    let baseFontSizePct = hasImg ? (textConfig.fontSizePct || 30) : (textConfig.onlyTextFontSizePct || 40);
    let lineHeight = hasImg ? (textConfig.lineHeight || 1.2) : (textConfig.onlyTextLineHeight || 1.2);
    let maxLines = hasImg ? (textConfig.maxLines || 2) : 100;
    let fittingMode = textConfig.fittingMode || TextConfig.TOO_LONG_AUTO;
    
    // Calculate font size in mm, then convert to points
    let fontSizeMM = currentHeight * (baseFontSizePct / 100);
    let fontSizePt = Math.max((fontSizeMM / 0.352778), 6); // Minimum 6pt font
    
    // Calculate available space for text
    let maxWidth = currentWidth - 2 * pdfOptions.textPadding;
    let maxHeight = currentHeight - 2 * pdfOptions.textPadding;
    
    // 4. Font color
    let textColor = [0, 0, 0]; // Default black text
    if (useElementColors) {
        try {
            let elementTextColor = util.getElementFontColor(element, metadata, bgColor);
            let rgbTextColor = util.getRGB(elementTextColor);
            if (rgbTextColor && Array.isArray(rgbTextColor) && rgbTextColor.length === 3) {
                textColor = rgbTextColor;
            }
        } catch (error) {
            console.warn('Error processing text color for element:', element.id, error);
            // Keep default black text
        }
    }
    
    let rgb = colorToRGB(textColor);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    
    // 5. Text fitting and truncation - improved algorithm
    let displayLabel = label;
    let actualFontSize = fontSizePt;
    let minFontSize = 6; // Minimum readable font size
    
    // Set initial font size
    doc.setFontSize(actualFontSize);
    
    // Get text dimensions
    let dim = doc.getTextDimensions(displayLabel);
    let textWidth = dim.w;
    let textHeight = dim.h;
    
    // Check if text fits
    let fits = textWidth <= maxWidth && textHeight <= maxHeight;
    
    if (!fits && fittingMode === TextConfig.TOO_LONG_AUTO) {
        // Auto-fit: reduce font size until text fits
        let step = Math.max(actualFontSize / 20, 0.5);
        while (!fits && actualFontSize > minFontSize) {
            actualFontSize -= step;
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(displayLabel);
            textWidth = dim.w;
            textHeight = dim.h;
            fits = textWidth <= maxWidth && textHeight <= maxHeight;
        }
        actualFontSize = Math.max(actualFontSize, minFontSize);
    } else if (!fits && fittingMode === TextConfig.TOO_LONG_TRUNCATE) {
        // Truncate text
        let truncated = '';
        for (let i = 0; i < displayLabel.length; i++) {
            let test = truncated + displayLabel[i];
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(test);
            if (dim.w > maxWidth) break;
            truncated = test;
        }
        displayLabel = truncated;
    } else if (!fits && fittingMode === TextConfig.TOO_LONG_ELLIPSIS) {
        // Truncate and add ellipsis
        let truncated = '';
        for (let i = 0; i < displayLabel.length; i++) {
            let test = truncated + displayLabel[i] + '...';
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(test);
            if (dim.w > maxWidth) break;
            truncated += displayLabel[i];
        }
        displayLabel = truncated + '...';
    }
    
    // Set final font size
    doc.setFontSize(actualFontSize);
    
    // 6. Text positioning - improved positioning logic
    let textPosition = textConfig.textPosition;
    let xOffset = xStartPos + currentWidth / 2;
    let yOffset;
    
    // Debug: Log positioning information
    console.log('Element has image:', hasImg);
    console.log('Text position config:', textPosition);
    console.log('Text position constant ABOVE:', TextConfig.TEXT_POS_ABOVE);
    console.log('Text position constant BELOW:', TextConfig.TEXT_POS_BELOW);
    
    if (hasImg) {
        if (textPosition === TextConfig.TEXT_POS_ABOVE) {
            // Text above image - position at the top with adequate padding and space for image below
            let topPadding = Math.max(pdfOptions.textPadding * 4, 5); // Increased padding for top positioning
            yOffset = yStartPos + topPadding + textHeight / 2;
            console.log('Positioning text ABOVE image, yOffset:', yOffset);
        } else {
            // Text below image (default) - improved positioning
            let bottomPadding = Math.max(pdfOptions.textPadding * 2, 3); // More padding for text below
            yOffset = yStartPos + currentHeight - bottomPadding - textHeight / 2;
            console.log('Positioning text BELOW image, yOffset:', yOffset);
        }
    } else {
        // Text-only: perfect vertical centering
        yOffset = yStartPos + currentHeight / 2;
        console.log('Positioning text-only in center, yOffset:', yOffset);
    }
    
    // Ensure text doesn't go outside cell bounds with improved constraints
    if (hasImg) {
        if (textPosition === TextConfig.TEXT_POS_ABOVE) {
            // For text on top, ensure adequate padding from top border and space for image
            let minTopDistance = Math.max(textHeight / 2 + pdfOptions.textPadding * 3, 5);
            yOffset = Math.max(yOffset, yStartPos + minTopDistance);
            // Ensure text doesn't go too far down and leave space for image
            yOffset = Math.min(yOffset, yStartPos + currentHeight * 0.2); // Keep text in top 20% of cell
        } else {
            // For text below image, ensure minimum distance from bottom
            let minBottomDistance = Math.max(textHeight / 2 + pdfOptions.textPadding * 2, 4);
            yOffset = Math.min(yOffset, yStartPos + currentHeight - minBottomDistance);
        }
    } else {
        // For text-only cells, ensure perfect centering with minimum padding
        let minPadding = Math.max(textHeight / 2 + pdfOptions.textPadding, 3);
        yOffset = Math.max(yOffset, yStartPos + minPadding);
        yOffset = Math.min(yOffset, yStartPos + currentHeight - minPadding);
    }
    
    // 7. Draw text
    try {
        doc.text(displayLabel, xOffset, yOffset, {
            baseline: 'middle',
            align: 'center',
            maxWidth: maxWidth
        });
    } catch (error) {
        console.warn('Error rendering text for element:', element.id, error);
        // Fallback: try with smaller font
        doc.setFontSize(Math.max(actualFontSize * 0.8, minFontSize));
        doc.text(displayLabel.substring(0, Math.min(displayLabel.length, 10)), xOffset, yOffset, {
            baseline: 'middle',
            align: 'center',
            maxWidth: maxWidth
        });
    }
}

function getOptimalFontsize(doc, text, baseSize, maxWidth, maxHeight, multipleLines) {
    let steps = 10;
    let size = baseSize;
    let stepSize = baseSize / 2;
    for (let i = 0; i < steps; i++) {
        doc.setFontSize(size);
        let dim = doc.getTextDimensions(text);
        if (multipleLines && text.indexOf(' ') !== -1) {
            let possibleLines = Math.floor(maxHeight / dim.h);
            let currentLines = Math.ceil(dim.w / maxWidth);
            if (dim.w / possibleLines > maxWidth * 0.5 || currentLines > possibleLines) {
                size -= stepSize;
            } else {
                size += stepSize;
            }
        } else {
            if (dim.w > maxWidth) {
                size -= stepSize;
            } else {
                size += stepSize;
            }
        }
        stepSize /= 2;
    }
    return Math.floor(Math.min(size, baseSize));
}

async function addImageToPdf(doc, element, elementWidth, elementHeight, xpos, ypos, metadata) {
    let hasImage = element && element.image && (element.image.data || element.image.url);
    if (!hasImage) {
        return Promise.resolve();
    }
    
    let type = new GridImage(element.image).getImageType();
    let imageData = element.image.data;
    let dim = null;
    
    // Load image data if not available
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
    
    // Get image dimensions if not available
    if (!dim) {
        try {
            dim = await imageUtil.getImageDimensionsFromDataUrl(imageData);
        } catch (error) {
            console.warn('Error getting image dimensions for element:', element.id, error);
            return Promise.resolve();
        }
    }
    
    // Check if we have valid dimensions
    if (!dim || !dim.ratio || isNaN(dim.ratio)) {
        console.warn('Invalid image dimensions for element:', element.id);
        return Promise.resolve();
    }
    
    // Calculate image size based on text configuration
    let textConfig = metadata && metadata.textConfig ? metadata.textConfig : {};
    let baseFontSizePct = textConfig.fontSizePct || 30;
    let hasText = i18nService.getTranslation(element.label);
    let textPosition = textConfig.textPosition;
    
    // Adjust image height and position based on text position
    let imgHeightPercentage = 0.65; // Default 65% of cell height
    let imageTopOffset = 0; // Default no offset
    
    if (hasText) {
        if (textPosition === TextConfig.TEXT_POS_ABOVE) {
            // Text is at top, position image lower with more space
            imgHeightPercentage = Math.max(0.25, Math.min(0.45, 1 - (baseFontSizePct / 100) * 1.2));
            imageTopOffset = Math.max(pdfOptions.textPadding * 4, 6); // Add space for text at top
        } else {
            // Text is at bottom, position image higher
            imgHeightPercentage = Math.max(0.35, Math.min(0.55, 1 - (baseFontSizePct / 100) * 0.9));
        }
    }
    
    // Calculate available space for image
    let maxWidth = elementWidth - 2 * pdfOptions.imgMargin;
    let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin - imageTopOffset) * imgHeightPercentage;
    
    // Ensure minimum size
    maxWidth = Math.max(maxWidth, 5);
    maxHeight = Math.max(maxHeight, 5);
    
    // Calculate aspect ratio
    let elementRatio = maxWidth / maxHeight;
    let imageRatio = dim.ratio;
    
    let width, height, xOffset, yOffset;
    
    if (imageRatio >= elementRatio) {
        // Image is wider than available space - fit to width
        width = maxWidth;
        height = width / imageRatio;
        xOffset = 0;
        yOffset = (maxHeight - height) / 2 + imageTopOffset;
    } else {
        // Image is taller than available space - fit to height
        height = maxHeight;
        width = height * imageRatio;
        xOffset = (maxWidth - width) / 2;
        yOffset = imageTopOffset;
    }
    
    // Ensure image doesn't exceed cell bounds
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);
    
    // Calculate final position
    let x = xpos + pdfOptions.imgMargin + xOffset;
    let y = ypos + pdfOptions.imgMargin + yOffset;
    
    // Ensure minimum size for visibility
    if (width < 2 || height < 2) {
        return Promise.resolve();
    }
    
    try {
        // Add image based on type
        if (type === GridImage.IMAGE_TYPES.PNG) {
            doc.addImage(imageData, 'PNG', x, y, width, height);
        } else if (type === GridImage.IMAGE_TYPES.JPEG) {
            doc.addImage(imageData, 'JPEG', x, y, width, height);
        } else if (type === GridImage.IMAGE_TYPES.SVG) {
            // Convert SVG to PNG for better compatibility
            let pixelWidth = Math.max(width / 0.084666667, 50); // Minimum 50px width
            let pngBase64 = await imageUtil.base64SvgToBase64Png(imageData, pixelWidth);
            if (pngBase64) {
                doc.addImage(pngBase64, 'PNG', x, y, width, height);
            }
        }
    } catch (error) {
        console.warn('Error adding image to PDF for element:', element.id, error);
    }
}

/**
 * load a font from remote and add it to jsPDF doc
 * @param path the path of the font, e.g. '/app/fonts/My-Font.ttf'
 * @param doc the jsPDF doc instance to install the font to
 * @return {Promise<void>}
 */
async function loadFont(path, doc) {
    try {
        let response = await fetch(path);
        if (!response || !response.ok) {
            console.warn('Could not load font from path:', path);
            return;
        }
        
        let fontName = path.substring(path.lastIndexOf('/') + 1);
        // Remove file extension
        fontName = fontName.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        
        console.info('Loading font:', fontName, 'from path:', path);
        
        let contentBuffer = await response.arrayBuffer();
        let contentString = util.arrayBufferToBase64(contentBuffer);
        if (contentString) {
            doc.addFileToVFS(fontName, contentString);
            doc.addFont(fontName, fontName, 'normal');
            console.info('Successfully loaded font:', fontName);
        }
    } catch (error) {
        console.warn('Error loading font from path:', path, error);
        // Continue without the font - will fall back to Arial
    }
}

/**
 * Check and log available fonts in the document
 * @param doc the jsPDF doc instance
 */
function logAvailableFonts(doc) {
    try {
        let currentFont = doc.getFont();
        console.log('Current font:', currentFont.fontName);
        console.log('Available fonts in document:', currentFont);
    } catch (error) {
        console.warn('Could not get font information:', error);
    }
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    if (metadata.textConfig) {
        convertMode = metadata.textConfig.convertMode;
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
    
    // For Safari, we need to ensure the page is fully loaded
    if (isSafari) {
        // Force a small delay to ensure Safari is ready
        setTimeout(() => {
            const beforePrintEvent = new Event('beforeprint');
            window.dispatchEvent(beforePrintEvent);
            
            // Additional delay for Safari
            setTimeout(() => {
                window.print();
            }, 200);
        }, 100);
    } else {
        // For other browsers
        const beforePrintEvent = new Event('beforeprint');
        window.dispatchEvent(beforePrintEvent);
        setTimeout(() => {
            window.print();
        }, 100);
    }
};

export { printService };
