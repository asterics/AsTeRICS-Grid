import jsPDF from 'jspdf';
import {GridData} from "../model/GridData";
import {GridImage} from "../model/GridImage";
import {i18nService} from "./i18nService";

let printService = {};
let gridInstance = null;
let pdfOptions = {
    docPadding: 5,
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

printService.gridsToPdf = async function (gridsData) {
    const doc = new jsPDF("landscape");

    for (let i = 0; i < gridsData.length; i++) {
        await addGridToPdf(doc, gridsData[i]);
        if (i < gridsData.length - 1) {
            doc.addPage();
        }
    }

    window.open(doc.output('bloburl'))
    //doc.save('new.pdf');
}

function addGridToPdf(doc, gridData) {
    let promises = [];
    let DOC_WIDTH = 297
    let DOC_HEIGHT = 210;

    gridData = new GridData(gridData);
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridData.getWidth();
    let elementTotalHeight = (DOC_HEIGHT - 2 * pdfOptions.docPadding) / gridData.getHeight();
    gridData.gridElements.forEach(element => {
        let currentWidth = elementTotalWidth * element.width - (2 * pdfOptions.elementMargin);
        let currentHeight = elementTotalHeight * element.height - (2 * pdfOptions.elementMargin);
        let xStartPos = pdfOptions.docPadding + (elementTotalWidth * element.x) + pdfOptions.elementMargin;
        let yStartPos = pdfOptions.docPadding + (elementTotalHeight * element.y) + pdfOptions.elementMargin;
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, 3, 3, "FD");
        if (i18nService.getTranslation(element.label)) {
            addLabelToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos);
        }
        if (element.image && element.image.data) {
            promises.push(addImageToPdf(doc, element, currentWidth, currentHeight, xStartPos, yStartPos));
        }
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
    return element.image.getDimensions().then(dim => {
        let type = element.image.getImageType();
        log.warn(type);
        let imgHeightPercentage = i18nService.getTranslation(element.label) ? pdfOptions.imgHeightPercentage : 1;
        let maxWidth = (elementWidth - 2 * pdfOptions.imgMargin);
        let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin) * imgHeightPercentage;
        let elementRatio = maxWidth / maxHeight;
        let width = maxWidth, height = maxHeight;
        let xOffset = 0, yOffset = 0;
        if (dim.ratio >= elementRatio) { // img has wider ratio than space in element
            height = width / dim.ratio;
            yOffset = (maxHeight - height) / 2;
        } else { //img has narrower ratio than space in element
            width = height * dim.ratio;
            xOffset = (maxWidth - width) / 2;
        }

        if (type === GridImage.IMAGE_TYPES.PNG) {
            addImg("PNG");
        }
        if (type === GridImage.IMAGE_TYPES.JPEG) {
            addImg("JPEG");
        }

        function addImg(type) {
            doc.addImage(element.image.data, type, xpos + pdfOptions.imgMargin + xOffset, ypos + pdfOptions.imgMargin + yOffset, width, height);
        }

        return Promise.resolve();
    })
}

export {printService};