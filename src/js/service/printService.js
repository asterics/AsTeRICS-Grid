import jsPDF from 'jspdf';
import {GridData} from "../model/GridData";
import {GridImage} from "../model/GridImage";

let printService = {};
let gridInstance = null;
let pdfOptions = {
    docPadding: 5,
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

    doc.setDrawColor(0);
    doc.setFillColor(255, 255, 255);
    gridData = new GridData(gridData);
    let elementTotalWidth = (DOC_WIDTH - 2 * pdfOptions.docPadding) / gridData.getWidth();
    let elementTotalHeight = (DOC_HEIGHT - 2 * pdfOptions.docPadding) / gridData.getHeight();
    gridData.gridElements.forEach(element => {
        let currentWidth = elementTotalWidth * element.width - (2 * pdfOptions.elementMargin);
        let currentHeight = elementTotalHeight * element.height - (2 * pdfOptions.elementMargin);
        let xStartPos = pdfOptions.docPadding + (elementTotalWidth * element.x) + pdfOptions.elementMargin;
        let yStartPos = pdfOptions.docPadding + (elementTotalHeight * element.y) + pdfOptions.elementMargin;
        doc.roundedRect(xStartPos, yStartPos, currentWidth, currentHeight, 3, 3, "FD");
        if (element.image && element.image.data) {
            promises.push(addImageToPdf(doc, element.image, currentWidth, currentHeight, xStartPos, yStartPos));
        }
    });
    return Promise.all(promises);
}

function addImageToPdf(doc, image, elementWidth, elementHeight, xpos, ypos) {
    return image.getDimensions().then(dim => {
        let type = image.getImageType();
        log.warn(type);
        let maxWidth = (elementWidth - 2 * pdfOptions.imgMargin);
        let maxHeight = (elementHeight - 2 * pdfOptions.imgMargin) * pdfOptions.imgHeightPercentage;
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
        } if (type === GridImage.IMAGE_TYPES.JPEG) {
            addImg("JPEG");
        }

        function addImg(type) {
            doc.addImage(image.data, type, xpos + pdfOptions.imgMargin + xOffset, ypos + pdfOptions.imgMargin + yOffset, width, height);
        }
        return Promise.resolve();
    })
}

export {printService};