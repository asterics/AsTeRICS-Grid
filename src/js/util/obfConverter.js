//Converter for OBF (open board format), see https://www.openboardformat.org/

import {GridData} from "../model/GridData";
import {GridElement} from "../model/GridElement";
import {GridImage} from "../model/GridImage";
import {GridActionSpeakCustom} from "../model/GridActionSpeakCustom";
import {GridActionNavigate} from "../model/GridActionNavigate";
import {GridActionSpeak} from "../model/GridActionSpeak";
import {imageUtil} from "./imageUtil";
import {i18nService} from "../service/i18nService";

let obfConverter = {};

obfConverter.gridDataToOBF = function (gridData) {

};

obfConverter.gridSetToOBZ = function (gridset) {

};

/**
 * converts an OBF JSON object to a gridData object
 * @param obfObject the OBF object to convert
 * @param obfObjects related OBF objects (e.g. other OBF objects that are linked to this obfObject)
 * @return {Promise<GridData>} the converted GridData object. The returned object has an additional property "obfId" containing
 *                    the original ID of the obfObject and possible GridActionNavigate with property "toGridId" also
 *                    contain the the obfId. Therefore in this case an additional step is needed to replace these obfIds
 *                    with the actual IDs of the GridData objects.
 */
obfConverter.OBFToGridData = function (obfObject, obfObjects) {
    let promises = [];
    let locale = obfObject.locale && obfObject.locale.length === 2 ? obfObject.locale.toLowerCase() : i18nService.getBrowserLang();
    let gridData = new GridData({
        obfId: obfObject.id,
        label: i18nService.getTranslationObject(obfObject.name, locale),
        locale: locale,
        rowCount: obfObject.grid.rows,
        minColumnCount: obfObject.grid.columns,
        gridElements: []
    });
    obfObject.buttons.forEach(button => {
        if (!button.hidden) {
            let xy = orderToXY(button.id, obfObject);
            let gridElement = new GridElement({
                width: 1,
                height: 1,
                label: i18nService.getTranslationObject(button.label, locale),
                x: xy.x,
                y: xy.y,
                backgroundColor: button.background_color
            });
            gridElement = addActions(gridElement, button, obfObject, obfObjects);
            let speakActions = gridElement.actions.filter(a => a.modelName === GridActionSpeak.getModelName());
            speakActions.forEach(action => {
                action.speakLanguage = obfObject.locale
            });
            promises.push(getGridImage(button.image_id, obfObject, obfObjects).then(gridImage => {
                gridElement.image = gridImage;
                return Promise.resolve();
            }));
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
 * @return {Promise<[]>}
 */
obfConverter.OBZToGridSet = function (obzFileMap) {
    let promises = [];
    let grids = [];
    Object.keys(obzFileMap).forEach(filename => {
        if (filename.indexOf('.obf') !== -1) {
            promises.push(obfConverter.OBFToGridData(obzFileMap[filename], obzFileMap).then(grid => {
                grids.push(grid);
                return Promise.resolve();
            }));
        }
    });

    //correct grid IDs in GridActionNavigate actions
    return Promise.all(promises).then(() => {
        grids.forEach(grid => {
            grid.gridElements.forEach(gridElement => {
                gridElement.actions.forEach(action => {
                    if (action.modelName === GridActionNavigate.getModelName()) {
                        let obfId = action.toGridId;
                        let gridId = grids.reduce((total, current) => {
                            return total || (current.obfId === obfId ? current.id : null);
                        }, null);
                        if (gridId) {
                            action.toGridId = gridId;
                        } else {
                            gridElement.actions = gridElement.actions.filter(a => a.id !== action.id);
                        }
                    }
                })
            });
        });
        grids.forEach(grid => {
            delete grid.obfId;
        });
        return Promise.resolve(grids);
    });
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
        gridElement.actions = gridElement.actions.filter(action => action.modelName !== GridActionSpeak.getModelName());
        gridElement.actions.push(new GridActionSpeakCustom({
            speakText: obfButton.vocalization,
            speakLanguage: obfObject.locale
        }));
    }
    if (obfButton.load_board && obfButton.load_board.path) {
        let obfId = obfPathToId(obfButton.load_board.path, obfObjects);
        if (obfId) {
            gridElement.actions.push(new GridActionNavigate({
                toGridId: obfId
            }));
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
    let manifest = obfObjects['manifest.json'];
    let boardsMap = manifest.paths.boards;
    let resultId = null;
    Object.keys(boardsMap).forEach(boardId => {
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
                }
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
    let obfImage = obfObject.images.filter(i => i.id === imageId)[0];
    let data = null;
    let promises = [];
    if (!obfImage) {
        return Promise.resolve(null);
    }
    if (obfImage.data) {
        data = obfImage.data;
    } else if (obfImage.path) {
        let postfix = obfImage.path.substring(obfImage.path.lastIndexOf('.'));
        let contentType = obfImage.content_type || "image/png";
        contentType = postfix === '.svg' ? 'image/svg+xml' : contentType;
        let preString = `data:${contentType};base64,`;
        let fileContent = obfObjects[obfImage.path];
        data = preString + fileContent;
    } else if (obfImage.url) {
        promises.push(imageUtil.urlToBase64(obfImage.url).then(base64 => {
            data = base64;
            return Promise.resolve();
        }));
    }
    return Promise.all(promises).then(() => {
        if (!data) {
            log.info('failed to import image: ' + imageId);
            return Promise.resolve(null);
        } else {
            return Promise.resolve(new GridImage({
                data: data
            }));
        }
    });
}

export {obfConverter};