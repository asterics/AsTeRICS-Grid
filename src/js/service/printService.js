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

let printService = {};
let gridInstance = null;
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
        if (gridInstance) {
            $('#grid-container').width('27.7cm');
            $('#grid-container').height('19cm');
            gridInstance.autosize();
        }
    });
    window.addEventListener('afterprint', () => {
        if (gridInstance) {
            $('#grid-container').width('');
            $('#grid-container').height('');
            gridInstance.autosize();
        }
    });
};

printService.setGridInstance = function (instance) {
    gridInstance = instance;
};

/**
 * Converts given grids to pdf and downloads the pdf file
 *
 * @param gridsData array of GridData to convert to pdf
 * @param options (optional) object containing options
 * @param options.showLinks if true, links on elements are created which are referring to another grid/page
 * @param options.backgroundColor object with r/g/b properties defining a background color for grid elements. Default: white.
 * @param options.progressFn a function that is called in order to report progress of the task.
 *                           Parameters passed: <percentage:Number, text:String, abortFn:Function>.
 *                           "abortFn" can be called in order to abort the task.
 * @return {Promise<void>}
 */
printService.gridsToPdf = async function (gridsData, options) {
    let jsPDF = await import(/* webpackChunkName: "jspdf" */ 'jspdf');
    options = options || {};
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
    let metadata = await dataService.getMetadata();
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
        options.page = i + 1;
        await addGridToPdf(doc, gridsData[i], options, metadata);
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

function addGridToPdf(doc, gridData, options, metadata) {
    let promises = [];
    let DOC_WIDTH = 297;
    let DOC_HEIGHT = 210;

    gridData = new GridData(gridData);
    let hasARASAACImages = gridData.gridElements.reduce(
        (total, element) =>
            total || (element.image && element.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME),
        false
    );
    let registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
    let footerHeight = hasARASAACImages ? 2 * pdfOptions.footerHeight : pdfOptions.footerHeight;
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridData.getWidth();
    let elementTotalHeight =
        (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight) / gridData.getHeight();
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
    gridData.gridElements.forEach((element) => {
        if (element.hidden) {
            return;
        }
        let currentWidth = elementTotalWidth * element.width - 2 * pdfOptions.elementMargin;
        let currentHeight = elementTotalHeight * element.height - 2 * pdfOptions.elementMargin;
        let xStartPos = pdfOptions.docPadding + elementTotalWidth * element.x + pdfOptions.elementMargin;
        let yStartPos = pdfOptions.docPadding + elementTotalHeight * element.y + pdfOptions.elementMargin;
        doc.setDrawColor(0);
        if (!options.printBackground) {
            doc.setFillColor(255, 255, 255);
        } else {
            let colorRGB = util.getRGB(MetaData.getElementColor(element, metadata));
            doc.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        }
        doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, 3, 3, 'FD');
        if (i18nService.getTranslation(element.label)) {
            addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos);
        }
        promises.push(
            addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos).then(() => {
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
                return Promise.resolve();
            })
        );
    });
    return Promise.all(promises);
}

function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos) {
    let label = i18nService.getTranslation(element.label);
    let hasImg = element.image && (element.image.data || element.image.url);
    let fontSizeMM = hasImg ? currentHeight * (1 - pdfOptions.imgHeightPercentage) : currentHeight / 2;
    let fontSizePt = (fontSizeMM / 0.352778) * 0.8;
    let maxWidth = currentWidth - 2 * pdfOptions.textPadding;
    if (convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        label = label.toLocaleUpperCase();
    } else if (convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        label = label.toLocaleLowerCase();
    }
    let optimalFontSize = getOptimalFontsize(
        doc,
        label,
        fontSizePt,
        maxWidth,
        currentHeight - 2 * pdfOptions.textPadding,
        !hasImg
    );
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(optimalFontSize);
    let dim = doc.getTextDimensions(label);
    let lines = Math.ceil(dim.w / maxWidth);
    let yOffset = hasImg ? currentHeight - 2 * pdfOptions.elementMargin : (currentHeight - dim.h * lines) / 2;
    doc.text(label, xStartPos + currentWidth / 2, yStartPos + yOffset, {
        baseline: hasImg ? 'bottom' : 'top',
        align: 'center',
        maxWidth: maxWidth
    });
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

async function addImageToPdf(doc, element, elementWidth, elementHeight, xpos, ypos) {
    let hasImage = element && element.image && (element.image.data || element.image.url);
    if (!hasImage) {
        return Promise.resolve();
    }
    let type = element.image.getImageType();
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
