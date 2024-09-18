//Converter for OBF (open board format), see https://www.openboardformat.org/

import { GridData } from '../model/GridData';
import { GridElement } from '../model/GridElement';
import { GridImage } from '../model/GridImage';
import { GridActionSpeakCustom } from '../model/GridActionSpeakCustom';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { GridActionSpeak } from '../model/GridActionSpeak';
import { i18nService } from '../service/i18nService';
import { fileUtil } from './fileUtil';
import { modelUtil } from './modelUtil';
import { MetaData } from '../model/MetaData';
import { imageUtil } from './imageUtil';
import { util } from './util';
import { dataService } from '../service/data/dataService';

let obfConverter = {};
let OBF_FORMAT_VERSION = 'open-board-0.1';
let OBF_BOARDS_PATH_PREFIX = 'boards/';
let OBF_IMAGES_PATH_PREFIX = 'images/';
let OBF_BOARD_POSTFIX = '.obf';
let OBF_MANIFEST_FILENAME = 'manifest.json';

obfConverter.gridDataToOBF = function(gridData, manifest) {
    let columns = new GridData(gridData).getWidthWithBounds();
    let obfGrid = {
        format: OBF_FORMAT_VERSION,
        id: gridData.id,
        name: i18nService.getTranslation(gridData.label),
        buttons: [],
        grid: {
            rows: gridData.rowCount,
            columns: columns,
            order: new Array(gridData.rowCount).fill(null)
        },
        images: []
    };
    obfGrid.grid.order = obfGrid.grid.order.map(() => new Array(columns).fill(null));
    for (let gridElement of gridData.gridElements) {
        let obfButton = gridElementToObfButton(gridElement, obfGrid, manifest);
        obfGrid.buttons.push(obfButton);
        obfGrid.grid.order[gridElement.y][gridElement.x] = gridElement.id;
    }
    return obfGrid;
};

obfConverter.backupDataToOBZ = async function(backupData, options = {}) {
    if (!backupData || !backupData.grids) {
        return null;
    }
    let metadata = backupData.metadata || (await dataService.getMetadata());
    let manifest = {
        format: OBF_FORMAT_VERSION,
        root: metadata.homeGridId ? `${OBF_BOARDS_PATH_PREFIX}${metadata.homeGridId}${OBF_BOARD_POSTFIX}` : undefined,
        paths: {
            boards: {},
            images: {},
            sounds: {}
        }
    };
    let boards = [];
    let fileMap = {};
    for (let gridData of backupData.grids) {
        let obfGrid = obfConverter.gridDataToOBF(gridData, manifest);
        boards.push(obfGrid);
    }

    // move images from inline data in boards to separate files
    for (let board of boards) {
        for (let button of board.buttons) {
            let image = board.images.find(i => i.id === button.image_id);
            if (image && image.data) {
                let suffix = imageUtil.dataStringToFileSuffix(image.data);
                let path = `${OBF_IMAGES_PATH_PREFIX}${image.id}.${suffix}`;
                fileMap[path] = util.base64ToBytes(imageUtil.dataStringToBase64(image.data));
                manifest.paths.images[image.id] = path;
                delete image.data;
                image.path = path;
            }
        }
    }

    for (let board of boards) {
        let path = `${OBF_BOARDS_PATH_PREFIX}${board.id}${OBF_BOARD_POSTFIX}`;
        fileMap[path] = board;
        manifest.paths.boards[board.id] = path;
    }
    fileMap[OBF_MANIFEST_FILENAME] = manifest;
    return fileUtil.createZip(fileMap, options);
};

function gridElementToObfButton(gridElement, obfGrid) {
    let obfButton = {
        id: gridElement.id,
        label: i18nService.getTranslation(gridElement.label),
        background_color: gridElement.backgroundColor
    };
    let obfImage = gridImageToObfImage(gridElement.image);
    if (obfImage) {
        obfButton.image_id = obfImage.id;
        obfGrid.images.push(obfImage);
    }
    for (let action of gridElement.actions) {
        if (action.modelName === GridActionNavigate.getModelName()) {
            obfButton.load_board = {
                path: `${OBF_BOARDS_PATH_PREFIX}${action.toGridId}${OBF_BOARD_POSTFIX}`
            };
        }
    }

    return obfButton;
}

function gridImageToObfImage(gridImage) {
    if (!gridImage || (!gridImage.data && !gridImage.url)) {
        return null;
    }
    let obfImage = {
        id: gridImage.id || modelUtil.generateId(GridImage.getIdPrefix())
    };
    if (gridImage.data) {
        obfImage.data = gridImage.data;
    } else if (gridImage.url) {
        obfImage.url = gridImage.url;
    }
    return obfImage;
}

/**
 * converts an OBF JSON object to a gridData object
 * @param obfObject the OBF object to convert
 * @param obfObjects related OBF objects (e.g. other OBF objects that are linked to this obfObject)
 * @return {Promise<GridData>} the converted GridData object. The returned object has an additional property "obfId" containing
 *                    the original ID of the obfObject and possible GridActionNavigate with property "toGridId" also
 *                    contain the the obfId. Therefore in this case an additional step is needed to replace these obfIds
 *                    with the actual IDs of the GridData objects.
 */
obfConverter.OBFToGridData = function(obfObject, obfObjects) {
    let promises = [];
    let locale = obfObject.locale ? obfObject.locale.toLowerCase() : i18nService.getContentLang();
    let baseLocale = i18nService.getBaseLang(locale);
    locale = i18nService.getAllLangCodes().includes(locale) ? locale :
        (i18nService.getAllLangCodes().includes(baseLocale) ? baseLocale : i18nService.getContentLang());
    obfObject.grid = obfObject.grid || { rows: 1, columns: 1, order: [] };
    let gridData = new GridData({
        obfId: obfObject.id,
        label: i18nService.getTranslationObject(obfObject.name, locale),
        rowCount: obfObject.grid.rows,
        minColumnCount: obfObject.grid.columns,
        gridElements: []
    });
    obfObject.buttons.forEach((button) => {
        if (!button.hidden) {
            let xy = orderToXY(button.id, obfObject);
            if (!xy) {
                xy = gridData.getNewXYPos();
            }
            let gridElement = new GridElement({
                width: 1,
                height: 1,
                label: i18nService.getTranslationObject(button.label, locale),
                x: xy.x || 0,
                y: xy.y || 0,
                backgroundColor: button.background_color
            });
            gridElement = addActions(gridElement, button, obfObject, obfObjects);
            let speakActions = gridElement.actions.filter((a) => a.modelName === GridActionSpeak.getModelName());
            speakActions.forEach((action) => {
                action.speakLanguage = obfObject.locale;
            });
            promises.push(
                getGridImage(button.image_id, obfObject, obfObjects).then((gridImage) => {
                    gridElement.image = gridImage;
                    return Promise.resolve();
                })
            );
            gridData.gridElements.push(gridElement);
        }
    });
    return Promise.all(promises).then(() => {
        return Promise.resolve(gridData);
    });
};

/**
 * converts the contents of an .obz file to a list of GridData objects
 * @param obzFileMap a map containing all files from the .obz archive in form {filepath => content}
 * @return {Promise<{metadata: MetaData, grids: *[]}>}
 */
obfConverter.OBZToImportData = async function(obzFileMap) {
    let grids = [];
    let manifest = obzFileMap[OBF_MANIFEST_FILENAME];
    let metadata = new MetaData();

    for (let filename of Object.keys(obzFileMap)) {
        if (filename.indexOf('.obf') !== -1) {
            let grid = await obfConverter.OBFToGridData(obzFileMap[filename], obzFileMap);
            grids.push(grid);
        }
    }

    // set home grid
    let obfIdToGridId = grids.reduce((total, grid) => {
        total[grid.obfId] = grid.id;
        return total;
    }, {});
    let obfBoardIds = Object.keys(manifest.paths.boards);
    let homeObfId = obfBoardIds.find(id => manifest.paths.boards[id] === manifest.root);
    homeObfId = homeObfId || obfBoardIds[0];
    metadata.homeGridId = obfIdToGridId[homeObfId];

    // correct grid IDs in GridActionNavigate actions
    for (let grid of grids) {
        for (let gridElement of grid.gridElements) {
            for (let action of gridElement.actions) {
                if (action.modelName === GridActionNavigate.getModelName()) {
                    let obfId = action.toGridId;
                    let gridId = obfIdToGridId[obfId];
                    if (gridId) {
                        action.toGridId = gridId;
                    } else {
                        gridElement.actions = gridElement.actions.filter((a) => a.id !== action.id);
                    }
                }
            }
        }
    }

    for (let grid of grids) {
        delete grid.obfId;
    }

    return {
        grids: grids,
        metadata: JSON.parse(JSON.stringify(metadata))
    };
};

/**
 * adds all possible actions to a grid element based on the OBF objects
 * @param gridElement the grid element to add the actions
 * @param obfButton the corresponding OBF button containing the actions
 * @param obfObject the current OBF object (grid) containing images or sounds
 * @param obfObjects a map of corresponding OBF objects, e.g. several grids where one is linked by this button
 * @return the gridElement containing all added actions. Note: GridActionNavigate objects are containing the obfId instead
 *         of the actual gridId therefore postprocessing is needed, also see documentation of obfConverter.OBFToGridData()
 */
function addActions(gridElement, obfButton, obfObject, obfObjects) {
    if (obfButton.vocalization) {
        gridElement.actions = gridElement.actions.filter(
            (action) => action.modelName !== GridActionSpeak.getModelName()
        );
        gridElement.actions.push(
            new GridActionSpeakCustom({
                speakText: obfButton.vocalization,
                speakLanguage: obfObject.locale
            })
        );
    }
    if (obfButton.load_board && obfButton.load_board.path) {
        let obfId = obfPathToId(obfButton.load_board.path, obfObjects);
        if (obfId) {
            gridElement.actions.push(
                new GridActionNavigate({
                    navType: GridActionNavigate.NAV_TYPES.TO_GRID,
                    toGridId: obfId
                })
            );
        }
    }
    return gridElement;
}

/**
 * converts an obf path (e.g. "boards/inline_images.obf") to the corresponding grid ID (e.g. "inline_images")
 * @param path the path to convert
 * @param obfObjects map of all obfObjects contained in the .obz archive in form of {filepath => content}
 * @return {*}
 */
function obfPathToId(path, obfObjects) {
    if (!obfObjects) {
        return null;
    }
    let manifest = obfObjects[OBF_MANIFEST_FILENAME];
    let boardsMap = manifest.paths.boards;
    let resultId = null;
    Object.keys(boardsMap).forEach((boardId) => {
        let currentPath = boardsMap[boardId];
        if (currentPath === path) {
            resultId = boardId;
        }
    });
    return resultId;
}

/**
 * converts the order property of the obfButton object to x/y coordinates for GridElement
 * @param buttonId the ID of the button to convert
 * @param obfObject the obfObject containing the button
 * @return {*} object with x and y property
 */
function orderToXY(buttonId, obfObject) {
    let order = obfObject.grid.order;
    let returnValue = null;
    order.forEach((row, rowIndex) => {
        row.forEach((id, columnIndex) => {
            if (id === buttonId) {
                returnValue = {
                    x: columnIndex,
                    y: rowIndex
                };
            }
        });
    });
    return returnValue;
}

/**
 * converts the image of an obfObject to a GridImage object
 * @param imageId the ID of the image to convert
 * @param obfObject the obfObject containing the image
 * @param map of all files contained in .obz archive in form (filepath => data)
 * @return {GridImage|null}
 */
function getGridImage(imageId, obfObject, obfObjects) {
    let obfImage = obfObject.images.filter((i) => i.id === imageId)[0];
    if (!obfImage) {
        return Promise.resolve(null);
    }
    let gridImage = new GridImage();
    if (obfImage.data) {
        gridImage.data = obfImage.data;
        return Promise.resolve(gridImage);
    } else if (obfImage.path) {
        let postfix = obfImage.path.substring(obfImage.path.lastIndexOf('.'));
        let contentType = obfImage.content_type || 'image/png';
        contentType = postfix === '.svg' ? 'image/svg+xml' : contentType;
        let preString = `data:${contentType};base64,`;
        let fileContent = obfObjects[obfImage.path];
        gridImage.data = preString + fileContent;
        return Promise.resolve(gridImage);
    } else if (obfImage.url) {
        gridImage.url = obfImage.url;
        return Promise.resolve(gridImage);
    }
    return Promise.resolve(null);
}

export { obfConverter };
