// Import of modules required for grid management and PDF generation
import { GridData } from '../model/GridData';
import { GridImage } from '../model/GridImage';
import { i18nService } from './i18nService';  // Service d'internationalisation
import { imageUtil } from '../util/imageUtil';  // Utilitaires pour le traitement des images
import { GridElement } from '../model/GridElement';
import { util } from '../util/util';
import { dataService } from './data/dataService.js';  // Service pour accéder aux données
import { MetaData } from '../model/MetaData.js';
import { arasaacService } from './pictograms/arasaacService.js';

let printService = {};
let gridInstance = null;

// PDF generation configuration options
let pdfOptions = {
    docPadding: 5,
    footerHeight: 8,
    textPadding: 3,
    elementMargin: 1,
    imgMargin: 1,
    imgHeightPercentage: 0.8
};

// Mapping of fonts according to the motifs used
let patternFontMappings = [
    {
        pattern: /^[\u0400-\u04FF]+$/,
        font: '/app/fonts/Arimo-Regular-Cyrillic.ttf'
    }
];

// Initialising event handlers for printing
printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        if (gridInstance) {
            $('#grid-container').css({ width: '27.7cm', height: '19cm' });
            gridInstance.autosize();
        }
    });
    window.addEventListener('afterprint', () => {
        if (gridInstance) {
            $('#grid-container').css({ width: '', height: '' });
            gridInstance.autosize();
        }
    });
};

// Function for configuring the grid instance used
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
printService.gridsToPdf = async function (gridsData, options = {}) {
    try {
        const { jsPDF } = await import(/* webpackChunkName: "jspdf" */ 'jspdf'); // Dynamic import of jsPDF
        const doc = new jsPDF({ orientation: 'landscape', compress: true });

        if (options.fontPath) {
            await loadFont(options.fontPath, doc); // Ensures that the policy is loaded before use
        }

        await processGrids(doc, gridsData, options); // Processes each grid for the PDF

        if (!options.abort) {
            doc.save('grid-export.pdf');
        }
    } catch (error) {
        console.error('Erreur lors de la génération du PDF :', error);
    }
};

async function loadFont(fontPath, doc) {
    const response = await fetch(fontPath);
    if (!response.ok) throw new Error('Failed to load font from ' + fontPath);
    const fontData = await response.arrayBuffer();
    const fontName = fontPath.split('/').pop();
    const base64Font = btoa(String.fromCharCode(...new Uint8Array(fontData)));
    doc.addFileToVFS(fontName, base64Font);
    doc.addFont(fontName, fontName, 'normal');
}

async function processGrids(doc, gridsData, options) {
    for (const grid of gridsData) {
        // Add the logic for processing each grid individually here
        if (options.progressFn) {
            options.progressFn(Math.round((100 * gridsData.indexOf(grid)) / gridsData.length), `Processing grid ${gridsData.indexOf(grid) + 1} of ${gridsData.length}`);
        }
        // Let's assume that an `addGridToPdf` function exists to add each grid to the PDF
        await addGridToPdf(doc, grid, options);
    }
}

async function addGridToPdf(doc, grid, options) {
    // Logic for adding grid details to the PDF
    // This part requires an implementation based on the specific needs of the project.
}

export { printService };
