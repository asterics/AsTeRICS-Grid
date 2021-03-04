import {GridData} from "../model/GridData";
import {GridImage} from "../model/GridImage";
import {i18nService} from "./i18nService";
import {imageUtil} from "../util/imageUtil";
import {GridElement} from "../model/GridElement";
import {util} from "../util/util";

let printService = {};
let gridInstance = null;
let pdfOptions = {
    docPadding: 5,
    footerHeight: 8,
    textPadding: 3,
    elementMargin: 1,
    imgMargin: 1,
    imgHeightPercentage: 0.8
}

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
}

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
 * @param options.showFooter if false, footer is not printed, default: true
 * @return {Promise<void>}
 */
printService.gridsToPdf = async function (gridsData, options) {
    import(/* webpackChunkName: "jspdf" */ 'jspdf').then(async jsPDF => {
        options = options || {};
        options.idPageMap = {};
        options.idParentsMap = {};
        gridsData.forEach((grid, index) => {
            options.idPageMap[grid.id] = index + 1;
        });
        gridsData.forEach((grid) => {
            options.idParentsMap[grid.id] = options.idParentsMap[grid.id] || [];
            grid.gridElements.forEach(element => {
                element = new GridElement(element);
                let nav = element.getNavigateGridId();
                if (nav) {
                    options.idParentsMap[nav] = options.idParentsMap[nav] || [];
                    options.idParentsMap[nav].push(options.idPageMap[grid.id]);
                }
            })
        });
        const doc = new jsPDF.jsPDF({
            orientation: "landscape",
            compress: true
        });
        options.pages = gridsData.length;
        for (let i = 0; i < gridsData.length && !options.abort; i++) {
            if (options.progressFn) {
                options.progressFn(Math.round(100 * (i) / gridsData.length), i18nService.translate('Creating page {?} of {?} // Erstelle Seite {?} von {?}', i+1, gridsData.length), () => {
                    options.abort = true;
                });
            }
            options.page = i + 1;
            await addGridToPdf(doc, gridsData[i], options);
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
    });
}

function addGridToPdf(doc, gridData, options) {
    let promises = [];
    let DOC_WIDTH = 297
    let DOC_HEIGHT = 210;

    gridData = new GridData(gridData);
    let registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
    let footerHeight = options.showFooter !== false ? pdfOptions.footerHeight : 0;
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridData.getWidth();
    let elementTotalHeight = (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight) / gridData.getHeight();
    if (footerHeight > 0) {
        let yBaseFooter = DOC_HEIGHT - pdfOptions.docPadding - registerHeight;
        let fontSizePt = (footerHeight * 0.4 / 0.352778);
        doc.setTextColor(0);
        doc.setFontSize(fontSizePt);
        let textL = i18nService.translate("Printed by AsTeRICS Grid, https://grid.asterics.eu // Gedruckt mit AsTeRICS Grid, https://grid.asterics.eu")
        let textC = i18nService.getTranslation(gridData.label);
        let firstParentPage = options.idParentsMap[gridData.id][0];
        if (options.showLinks && firstParentPage) {
            let prefix = JSON.stringify(options.idParentsMap[gridData.id].slice(0, 5));
            textC = prefix + " => " + textC;
            let textWidth = doc.getTextWidth(textC);
            doc.link(DOC_WIDTH / 2 - textWidth / 2, yBaseFooter - footerHeight * 0.4, textWidth, footerHeight * 0.4, {pageNumber: firstParentPage});
        }
        let currentPage = options.idPageMap[gridData.id] || 1;
        let totalPages = Object.keys(options.idPageMap).length || 1
        let textR = currentPage + " / " + totalPages;
        doc.text(textL, pdfOptions.docPadding + pdfOptions.elementMargin, yBaseFooter, {
            baseline: 'bottom',
            align: 'left'
        });
        doc.text(textC, DOC_WIDTH / 2, yBaseFooter, {
            baseline: 'bottom',
            align: 'center'
        });
        doc.text(textR, DOC_WIDTH - pdfOptions.docPadding - pdfOptions.elementMargin, yBaseFooter, {
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
            doc.roundedRect(i * registerElementWidth, DOC_HEIGHT - registerHeight, registerElementWidth, registerHeight, 0, 0);
            let maxPage = (i * stepSize) + 1;
            if (maxPage <= options.page) {
                doc.text(maxPage + '', i * registerElementWidth + registerElementWidth / 2, DOC_HEIGHT - registerHeight / 2, {
                    baseline: 'middle',
                    align: 'center'
                });
            }
        }
    }
    gridData.gridElements.forEach(element => {
        let currentWidth = elementTotalWidth * element.width - (2 * pdfOptions.elementMargin);
        let currentHeight = elementTotalHeight * element.height - (2 * pdfOptions.elementMargin);
        let xStartPos = pdfOptions.docPadding + (elementTotalWidth * element.x) + pdfOptions.elementMargin;
        let yStartPos = pdfOptions.docPadding + (elementTotalHeight * element.y) + pdfOptions.elementMargin;
        doc.setDrawColor(0);
        if (!options.printBackground) {
            doc.setFillColor(255, 255, 255);
        } else {
            let colorRGB = util.getRGB(element.backgroundColor);
            colorRGB = colorRGB ? colorRGB : [173, 216, 230];
            doc.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        }
        doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, 3, 3, "FD");
        if (i18nService.getTranslation(element.label)) {
            addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos);
        }
        promises.push(addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos).then(() => {
            if (options.showLinks && options.idPageMap[element.getNavigateGridId()]) {
                let targetPage = options.idPageMap[element.getNavigateGridId()];
                let iconWidth = Math.max(currentWidth / 10, 7);
                let offsetX = currentWidth - iconWidth - 1;
                let offsetY = 1;
                doc.setDrawColor(255);
                doc.setFillColor(90, 113, 122);
                doc.roundedRect(xStartPos + offsetX, yStartPos + offsetY, iconWidth, iconWidth, 1, 1, "FD");
                doc.link(xStartPos, yStartPos, currentWidth, currentHeight, {pageNumber: targetPage});
                if (targetPage) {
                    let fontSizePt = (iconWidth * 0.6 / 0.352778)
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(fontSizePt);
                    doc.text(targetPage + "", xStartPos + offsetX + iconWidth / 2, yStartPos + offsetY + iconWidth / 2, {
                        baseline: 'middle',
                        align: 'center',
                        maxWidth: iconWidth
                    });
                }
            }
            return Promise.resolve();
        }));
    });
    return Promise.all(promises);
}

function addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos) {
    let label = i18nService.getTranslation(element.label);
    let hasImg = element.image && element.image.data;
    let fontSizeMM = hasImg ? currentHeight * (1 - pdfOptions.imgHeightPercentage) : currentHeight / 2;
    let fontSizePt = (fontSizeMM / 0.352778) * 0.8;
    let maxWidth = currentWidth - 2 * pdfOptions.textPadding;
    let optimalFontSize = getOptimalFontsize(doc, label, fontSizePt, maxWidth, currentHeight - 2 * pdfOptions.textPadding, !hasImg);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(optimalFontSize);
    let dim = doc.getTextDimensions(label);
    let lines = Math.ceil(dim.w / maxWidth)
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

function addImageToPdf(doc, element, elementWidth, elementHeight, xpos, ypos) {
    if (!element || !element.image || !element.image.data || element.image.data.indexOf('data:') !== 0) {
        return Promise.resolve();
    }
    return element.image.getDimensions().then(async dim => {
        let type = element.image.getImageType();
        let imgHeightPercentage = i18nService.getTranslation(element.label) ? pdfOptions.imgHeightPercentage : 1;
        let maxWidth = (elementWidth - 2 * pdfOptions.imgMargin);
        let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin) * imgHeightPercentage;
        let elementRatio = maxWidth / maxHeight;
        let width = maxWidth, height = maxHeight;
        let xOffset = 0, yOffset = 0;
        if (dim.ratio >= elementRatio) { // img has wider ratio than space in element
            if (!isNaN(dim.ratio)) {
                height = width / dim.ratio;
            }
            yOffset = (maxHeight - height) / 2;
        } else { //img has narrower ratio than space in element
            if (!isNaN(dim.ratio)) {
                width = height * dim.ratio;
            }
            xOffset = (maxWidth - width) / 2;
        }

        let x = xpos + pdfOptions.imgMargin + xOffset;
        let y = ypos + pdfOptions.imgMargin + yOffset;
        if (type === GridImage.IMAGE_TYPES.PNG) {
            addImg("PNG");
        } else if (type === GridImage.IMAGE_TYPES.JPEG) {
            addImg("JPEG");
        } else if (type === GridImage.IMAGE_TYPES.SVG) {
            let pixelWidth = width / 0.084666667; //convert width in mm to pixel at 300dpi
            let pngBase64 = await imageUtil.base64SvgToBase64Png(element.image.data, pixelWidth);
            doc.addImage(pngBase64, type, x, y, width, height);
        }

        function addImg(type) {
            doc.addImage(element.image.data, type, x, y, width, height);
        }

        return Promise.resolve();
    })
}

export {printService};