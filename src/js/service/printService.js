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
import { gridUtil } from '../util/gridUtil';
import { fontUtil } from '../util/fontUtil';

let printService = {};
let pdfOptions = {
    docPadding: 5,
    footerHeight: 8,
    textPadding: 3,
    elementMargin: 1,
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

printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        $('#grid-container').width('27.7cm');
        $('#grid-container').height('19cm');
    });
    window.addEventListener('afterprint', () => {
        $('#grid-container').width('');
        $('#grid-container').height('');
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
    if (options.fontPath) {
        await loadFont(options.fontPath, doc);
    }

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
        //window.open(doc.output('bloburl'))
        doc.save('grid-export.pdf');
    }
};

async function addGridToPdf(doc, gridData, options, metadata, globalGrid) {
    let promises = [];
    let DOC_WIDTH = 297;
    let DOC_HEIGHT = 210;

    gridData = new GridData(gridData);
    gridData = gridUtil.mergeGrids(gridData, globalGrid, metadata);
    let hasARASAACImages = gridData.gridElements.reduce(
        (total, element) =>
            total || (element.image && element.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME),
        false
    );
    let registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
    let footerHeight = hasARASAACImages ? 2 * pdfOptions.footerHeight : pdfOptions.footerHeight;
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridUtil.getWidthWithBounds(gridData);
    let elementTotalHeight =
        (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight) / gridUtil.getHeightWithBounds(gridData);
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
        // 1. Background color
        let bgColor = options.printBackground ? util.getRGB(MetaData.getElementColor(element, metadata)) : [255, 255, 255];
        // 2. Border color
        let colorConfig = metadata && metadata.colorConfig ? metadata.colorConfig : {};
        let borderColor = colorConfig.elementBorderColor || constants.DEFAULT_ELEMENT_BORDER_COLOR;
        let colorMode = colorConfig.colorMode || 'COLOR_MODE_BACKGROUND';
        if (colorMode === 'COLOR_MODE_BORDER') {
            borderColor = MetaData.getElementColor(element, metadata, borderColor);
        } else if (colorMode === 'COLOR_MODE_BOTH') {
            if (!element.colorCategory) {
                borderColor = [0,0,0,0]; // transparent
            } else {
                // Try to mimic the UI's adjustment logic
                let colorScheme = MetaData.getUseColorScheme(metadata);
                if (colorScheme && colorScheme.customBorders && colorScheme.customBorders[element.colorCategory]) {
                    borderColor = util.hexToRgb(colorScheme.customBorders[element.colorCategory]);
                } else {
                    let absAdjustment = 40;
                    let bgHex = MetaData.getElementColor(element, metadata, borderColor);
                    let isDark = fontUtil.isHexDark(bgHex);
                    let adjustment = isDark ? absAdjustment * 1.5 : absAdjustment * -1;
                    // Use fontUtil.adjustHexColor to get adjusted color
                    borderColor = util.hexToRgb(fontUtil.adjustHexColor(bgHex, adjustment, true));
                }
            }
        } else if (borderColor === constants.DEFAULT_ELEMENT_BORDER_COLOR) {
            // Use high-contrast border if default
            let gridBg = colorConfig.gridBackgroundColor || constants.COLORS.WHITE;
            borderColor = fontUtil.getHighContrastColor(gridBg, constants.COLORS.WHITESMOKE, constants.COLORS.GRAY);
            borderColor = util.hexToRgb(borderColor);
        } else {
            borderColor = util.hexToRgb(borderColor);
        }
        // 3. Border width and radius
        let borderWidth = colorConfig.borderWidth || 0.1;
        let borderRadius = colorConfig.borderRadius || 0.4;
        // Convert borderWidth and borderRadius from percent to mm (approximate)
        // UI uses pctToPx, but here we use mm, so scale by cell size
        let currentWidth = elementTotalWidth * element.width - 2 * pdfOptions.elementMargin;
        let currentHeight = elementTotalHeight * element.height - 2 * pdfOptions.elementMargin;
        let xStartPos = pdfOptions.docPadding + elementTotalWidth * element.x + pdfOptions.elementMargin;
        let yStartPos = pdfOptions.docPadding + elementTotalHeight * element.y + pdfOptions.elementMargin;
        let borderWidthMM = (borderWidth / 100) * Math.min(currentWidth, currentHeight) * 2; // scale up for visibility
        let borderRadiusMM = (borderRadius / 100) * Math.min(currentWidth, currentHeight) * 2;
        // --- Draw cell ---
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(borderWidthMM);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, borderRadiusMM, borderRadiusMM, 'FD');
        if (i18nService.getTranslation(element.label)) {
            await addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata);
        }
        await addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos);
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

async function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos, bgColor, metadata) {
    // 1. Get label and apply convert mode
    let label = i18nService.getTranslation(element.label);
    let textConfig = metadata && metadata.textConfig ? metadata.textConfig : {};
    let hasImg = element.image && (element.image.data || element.image.url);
    let convertMode = (element.convertMode !== undefined && element.convertMode !== null) ? element.convertMode : textConfig.convertMode;
    if (convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        label = label.toLocaleUpperCase();
    } else if (convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        label = label.toLocaleLowerCase();
    }

    // 2. Font family
    let fontFamily = (element.fontFamily && TextConfig.FONTS.includes(element.fontFamily)) ? element.fontFamily : (textConfig.fontFamily || 'Arial');
    try {
        doc.setFont(fontFamily);
    } catch (e) {
        doc.setFont('Arial'); // fallback
    }

    // 3. Font size (percent of cell height, with fitting if needed)
    let baseFontSizePct = hasImg ? textConfig.fontSizePct : textConfig.onlyTextFontSizePct;
    if (element.fontSizePct && Number.isFinite(element.fontSizePct)) {
        baseFontSizePct = element.fontSizePct;
    }
    let lineHeight = hasImg ? textConfig.lineHeight : textConfig.onlyTextLineHeight;
    let maxLines = hasImg ? textConfig.maxLines : 100;
    let fittingMode = textConfig.fittingMode || TextConfig.TOO_LONG_AUTO;
    let fontSizeMM = currentHeight * (baseFontSizePct / 100);
    let fontSizePt = (fontSizeMM / 0.352778) * 0.8;
    let maxWidth = currentWidth - 2 * pdfOptions.textPadding;
    let maxHeight = (fontSizePt * lineHeight * maxLines);

    // 4. Font color (element override, fallback, or auto-contrast)
    let fontColor = element.fontColor || textConfig.fontColor;
    let textColor;
    if (!fontColor || fontColor === constants.COLORS.BLACK || fontColor === constants.COLORS.WHITE) {
        textColor = fontUtil.getHighContrastColorRgb(bgColor);
    } else {
        textColor = util.hexToRgb(fontColor);
    }
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // 5. Truncation/ellipsis/auto-fit
    let displayLabel = label;
    let dim = doc.getTextDimensions(displayLabel);
    let lines = Math.ceil(dim.w / maxWidth);
    let actualFontSize = fontSizePt;
    if (fittingMode === TextConfig.TOO_LONG_AUTO && (dim.w > maxWidth || lines > maxLines)) {
        // Reduce font size to fit
        let step = fontSizePt / 10;
        for (let i = 0; i < 10; i++) {
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(displayLabel);
            lines = Math.ceil(dim.w / maxWidth);
            if (dim.w <= maxWidth && lines <= maxLines) break;
            actualFontSize -= step;
            if (actualFontSize < 2) break;
        }
    } else if (fittingMode === TextConfig.TOO_LONG_TRUNCATE && (dim.w > maxWidth || lines > maxLines)) {
        // Truncate text
        let truncated = '';
        for (let i = 0; i < displayLabel.length; i++) {
            let test = truncated + displayLabel[i];
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(test);
            lines = Math.ceil(dim.w / maxWidth);
            if (dim.w > maxWidth || lines > maxLines) break;
            truncated = test;
        }
        displayLabel = truncated;
    } else if (fittingMode === TextConfig.TOO_LONG_ELLIPSIS && (dim.w > maxWidth || lines > maxLines)) {
        // Truncate and add ellipsis
        let truncated = '';
        for (let i = 0; i < displayLabel.length; i++) {
            let test = truncated + displayLabel[i] + '...';
            doc.setFontSize(actualFontSize);
            dim = doc.getTextDimensions(test);
            lines = Math.ceil(dim.w / maxWidth);
            if (dim.w > maxWidth || lines > maxLines) break;
            truncated += displayLabel[i];
        }
        displayLabel = truncated + '...';
    }
    doc.setFontSize(actualFontSize);

    // 6. Text position (above/below image)
    let textPosition = (element.textPosition !== undefined && element.textPosition !== null) ? element.textPosition : textConfig.textPosition;
    let yOffset;
    if (hasImg) {
        if (textPosition === TextConfig.TEXT_POS_ABOVE) {
            yOffset = yStartPos + (actualFontSize * lineHeight * maxLines) / 2 + pdfOptions.textPadding;
        } else {
            // BELOW (default)
            yOffset = yStartPos + currentHeight - pdfOptions.textPadding;
        }
    } else {
        // text-only: center vertically
        yOffset = yStartPos + (currentHeight + actualFontSize * lineHeight) / 2 - pdfOptions.textPadding;
    }

    // 7. Draw text (centered)
    doc.text(displayLabel, xStartPos + currentWidth / 2, yOffset, {
        baseline: hasImg ? (textPosition === TextConfig.TEXT_POS_ABOVE ? 'top' : 'bottom') : 'middle',
        align: 'center',
        maxWidth: maxWidth
    });
}

async function addImageToPdf(doc, element, elementWidth, elementHeight, xpos, ypos) {
    let hasImage = element && element.image && (element.image.data || element.image.url);
    if (!hasImage) {
        return Promise.resolve();
    }
    let type = new GridImage(element.image).getImageType();
    let imageData = element.image.data;
    let dim = null;
    if (!imageData) {
        let dataWithDim = await imageUtil.urlToBase64WithDimensions(element.image.url, 500, type);
        imageData = dataWithDim.data;
        dim = dataWithDim.dim;
    }
    if (!imageData) {
        return Promise.resolve();
    }
    if (!dim) {
        dim = await imageUtil.getImageDimensionsFromDataUrl(imageData);
    }
    let imgHeightPercentage = i18nService.getTranslation(element.label) ? pdfOptions.imgHeightPercentage : 1;
    let maxWidth = elementWidth - 2 * pdfOptions.imgMargin;
    let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin) * imgHeightPercentage;
    let elementRatio = maxWidth / maxHeight;
    let width = maxWidth,
        height = maxHeight;
    let xOffset = 0,
        yOffset = 0;
    if (dim.ratio >= elementRatio) {
        // img has wider ratio than space in element
        if (!isNaN(dim.ratio)) {
            height = width / dim.ratio;
        }
        yOffset = (maxHeight - height) / 2;
    } else {
        //img has narrower ratio than space in element
        if (!isNaN(dim.ratio)) {
            width = height * dim.ratio;
        }
        xOffset = (maxWidth - width) / 2;
    }

    let x = xpos + pdfOptions.imgMargin + xOffset;
    let y = ypos + pdfOptions.imgMargin + yOffset;
    if (type === GridImage.IMAGE_TYPES.PNG) {
        doc.addImage(imageData, 'PNG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.JPEG) {
        doc.addImage(imageData, 'JPEG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.SVG) {
        let pixelWidth = width / 0.084666667; //convert width in mm to pixel at 300dpi
        let pngBase64 = await imageUtil.base64SvgToBase64Png(imageData, pixelWidth);
        doc.addImage(pngBase64, type, x, y, width, height);
    }
}

/**
 * load a font from remote and add it to jsPDF doc
 * @param path the path of the font, e.g. '/app/fonts/My-Font.ttf'
 * @param doc the jsPDF doc instance to install the font to
 * @return {Promise<void>}
 */
async function loadFont(path, doc) {
    let response = await fetch(path).catch((e) => console.error(e));
    if (!response) {
        return;
    }
    let fontName = path.substring(path.lastIndexOf('/') + 1);
    log.info('using font', fontName);
    let contentBuffer = await response.arrayBuffer();
    let contentString = util.arrayBufferToBase64(contentBuffer);
    if (contentString) {
        doc.addFileToVFS(fontName, contentString);
        doc.addFont(fontName, fontName, 'normal');
        doc.setFont(fontName);
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

export { printService };
