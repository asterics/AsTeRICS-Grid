import FileSaver from 'file-saver';

import {GridData} from "../../model/GridData.js";
import {GridImage} from "../../model/GridImage";
import {MetaData} from "../../model/MetaData";
import {modelUtil} from "../../util/modelUtil";
import {translateService} from "../translateService";
import {databaseService} from "./databaseService";
import {dataUtil} from "../../util/dataUtil";
import {pouchDbService} from "./pouchDbService";

let dataService = {};

/**
 * gets a grid by ID.
 * @see{GridData}
 *
 * @param id the ID of the grid
 * @param onlyShortVersion if true only the short version (with stripped binary data) is returned (optional)
 * @return {Promise} resolves to a grid object that was found
 */
dataService.getGrid = function (id, onlyShortVersion) {
    return new Promise(resolve => {
        if(!id) {
            resolve(null);
        }
        databaseService.getObject(GridData, id, onlyShortVersion).then(grids => {
            let retVal = grids && grids.length > 0 ? grids[0] : grids;
            resolve(retVal);
        });
    });
};

/**
 * Gets an array of all grids.
 * @see{GridData}
 *
 * @param onlyShortVersion if true only the short version (with stripped binary data) is returned (optional)
 * @return {Promise} resolves to an array of all stored grids.
 */
dataService.getGrids = function (onlyShortVersion) {
    return new Promise(resolve => {
        databaseService.getObject(GridData, null, onlyShortVersion).then(grids => {
            if (!grids) {
                resolve([]);
            } else {
                let retVal = grids instanceof Array ? grids : [grids];
                resolve(retVal);
            }
        });
    });
};

/**
 * Saves a grid or updates it, if existing.
 * @see{GridData}
 *
 * @param gridData the GridData to save/update
 * @return {Promise} resolves after operation finished successful
 */
dataService.saveGrid = function (gridData) {
    return databaseService.saveObject(GridData, gridData);
};

/**
 * Updates a grid, if existing. If not existing, nothing is done.
 * @see{GridData}
 *
 * @param gridId the ID of the grid to update
 * @param newConfig updated grid data
 * @return {Promise} resolves after operation finished successful
 */
dataService.updateGrid = function (gridId, newConfig) {
    newConfig.id = gridId;
    return databaseService.saveObject(GridData, newConfig, true);
};

/**
 * Deletes a grid.
 *
 * @param gridId the ID of the grid to delete.
 * @return {Promise}
 */
dataService.deleteGrid = function (gridId) {
    return databaseService.removeObject(gridId);
};

/**
 * Adds additional grid files to a grid. If a filename that is added already exists, the
 * existing file is replaced.
 * @see{AdditionalGridFile}
 *
 * @param gridId the ID of the grid to add the additional files
 * @param additionalGridFiles array of objects of type @see{AdditionalGridFile}
 * @return {Promise} resolves after operation finished successful
 */
dataService.saveAdditionalGridFiles = function (gridId, additionalGridFiles) {
    return new Promise(resolve => {
        if (!additionalGridFiles) {
            resolve();
        }
        dataService.getGrid(gridId).then(grid => {
            additionalGridFiles.forEach(gridFile => {
                grid = JSON.parse(JSON.stringify(grid));
                let index = grid.additionalFiles.findIndex(f => f.fileName === gridFile.fileName);
                if (index !== -1) {
                    grid.additionalFiles[index] = gridFile;
                } else {
                    grid.additionalFiles.push(gridFile);
                }
            });
            dataService.saveGrid(grid).then(() => {
                resolve();
            });
        })
    });
};

/**
 * Gets a single element of a grid.
 * @see{GridElement}
 *
 * @param gridId the ID of the grid, which contains the element
 * @param gridElementId the ID of the element to get
 * @return {Promise} resolves with the grid element as parameter.
 */
dataService.getGridElement = function (gridId, gridElementId) {
    return new Promise(resolve => {
        dataService.getGrid(gridId).then(grid => {
            resolve(grid.gridElements.filter(elm => elm.id === gridElementId)[0]);
        });
    });
};

/**
 * returns a map with keys == gridIds and values of the given attribute parameter
 * e.g. attribute == "label" will return a map of <gridIds -> gridLabel>
 * @see{GridData} for possible attributes
 *
 * @param attribute the attribute name as string
 * @return {Promise} an object with a mapping of <gridId -> attribute>
 */
dataService.getGridsAttribute = function (attribute) {
    return new Promise(resolve => {
        dataService.getGrids(true).then(grids => {
            let returnMap = {};
            grids.forEach(grid => {
                returnMap[grid.id] = grid[attribute];
            });
            resolve(returnMap);
        })
    });
};

/**
 * Adds or updates a grid element.
 * @see{GridElement}
 *
 * @param gridId the ID of the grid for which the element should be added/updated
 * @param updatedGridElement the gridElement of type @see{GridElement.js}
 * @return {Promise} resolves after operation finished successful
 */
dataService.updateOrAddGridElement = function (gridId, updatedGridElement) {
    return new Promise(resolve => {
        dataService.getGrid(gridId).then(grid => {
            grid = JSON.parse(JSON.stringify(grid));
            updatedGridElement = JSON.parse(JSON.stringify(updatedGridElement));
            let index = grid.gridElements.map(el => el.id).indexOf(updatedGridElement.id);

            if (index !== -1) {
                grid.gridElements[index] = updatedGridElement;
            } else {
                grid.gridElements.push(updatedGridElement);
            }

            dataService.updateGrid(gridId, grid).then(() => {
                resolve();
            });
        });
    });
};

/**
 * Adds an array of new grid elements to a grid.
 * @see{GridElement}
 *
 * @param gridId the ID of the grid where the new elements should be added
 * @param newGridElements array of new elements of type @see{GridElement}
 * @return {Promise} resolves after operation finished successful
 */
dataService.addGridElements = function (gridId, newGridElements) {
    return new Promise(resolve => {
        dataService.getGrid(gridId).then(grid => {
            grid = JSON.parse(JSON.stringify(grid));
            grid.gridElements = grid.gridElements.concat(newGridElements);
            dataService.updateGrid(gridId, grid).then(() => {
                resolve();
            });
        });
    });
};

/**
 * Saves metadata to database. Metadata is always stored with the same ID, so only one metadata object can exist in
 * the database.
 * @see{MetaData}
 *
 * @param newMetadata new or updated metadata object
 * @return {Promise} resolves after operation finished successful
 */
dataService.saveMetadata = function (newMetadata) {
    return new Promise(resolve => {
        dataService.getMetadata().then(existingMetadata => {
            if (existingMetadata) {
                //new metadata is stored with ID of existing metadata -> there should only be one metadata object
                let id = existingMetadata instanceof Array ? existingMetadata[0].id : existingMetadata.id;
                newMetadata.id = id;
            }
            if (!existingMetadata.isEqual(newMetadata)) {
                databaseService.saveObject(MetaData, newMetadata).then(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
};

/**
 * Retrieves the metadata object.
 * @see{MetaData}
 *
 * @return {Promise} resolving with the metadata object as parameter
 */
dataService.getMetadata = function () {
    return new Promise(resolve => {
        databaseService.getObject(MetaData).then(result => {
            if (!result) {
                resolve(new MetaData());
            } else if (result instanceof Array) {
                resolve(result[0]);
            } else {
                resolve(result);
            }
        });
    });
};

/**
 * saves the given imageData, if it was not already saved
 * @see{GridImage}
 *
 * @param imgData the data of type GridImage
 * @return {Promise} the id of the newly saved image data or an id of an existing image data with the same hash
 */
dataService.saveImage = function (imgData) {
    return saveHashedItemInternal(GridImage, imgData);
};

/**
 * returns a GridImage by ID.
 * @see{GridImage}
 *
 * @param imgId the ID of the grid image to return.
 * @return {Promise} resolves to the grid image object
 */
dataService.getImage = function (imgId) {
    return databaseService.getObject(GridImage, imgId);
};

/**
 * Downloads to whole database to File. Opens a file download in Browser.
 */
dataService.downloadDB = function () {
    pouchDbService.dumpDatabase().then(dumpedString => {
        let blob = new Blob([dumpedString], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, "my-grids-backup.grb");
    });
};

/**
 * Downloads to a single grid to File. Opens a file download in Browser.
 * @param gridId the ID of the grid to download
 */
dataService.downloadSingleGrid = function (gridId) {
    dataService.getGrid(gridId).then(gridData => {
        if (gridData) {
            let blob = new Blob([JSON.stringify(gridData)], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, gridData.label + ".grd");
        }
    });
};

/**
 * Downloads all grids to File. Opens a file download in Browser.
 */
dataService.downloadAllGrids = function () {
    dataService.getGrids().then(grids => {
        if (grids) {
            let blob = new Blob([JSON.stringify(grids)], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, "my-gridset.grd");
        }
    });
};

/**
 * logs a simple version of all grids without base64 contents to console => used for legacy mode
 */
dataService.downloadAllGridsSimple = function () {
    dataService.getGrids().then(grids => {
        if (grids) {
            log.info("simple version of exported grids without images and files included:");
            log.info(JSON.stringify({grids: dataUtil.removeLongPropertyValues(grids)})); //has to be in object to be valid JSON
        }
    });
};

/**
 * imports grids from a file that was exported by downloadSingleGrid() or downloadAllGrids()
 *
 * @param file the file object from a file input that contains the data
 * @return {Promise} resolves after operation finished successful
 */
dataService.importGridsFromFile = function (file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                let jsonString = e.target.result;
                dataService.importGridsFromJSON(jsonString).then(() => {
                    resolve();
                });
            }
        })(file);
        reader.readAsText(file);
    });
};

/**
 * imports grids from a json string.
 * @see{GridData}
 *
 * @param jsonString a valid json string containing serialized grid data.
 * @return {Promise} resolves after operation finished successful
 */
dataService.importGridsFromJSON = function (jsonString) {
    return new Promise(resolve => {
        let gridData = JSON.parse(jsonString);
        if (!(gridData instanceof Array)) {
            gridData = [gridData];
        }
        dataService.getGrids().then(grids => {
            let existingNames = grids.map(grid => grid.label);
            let existingIds = grids.map(grid => grid.id);
            let resolveFns = [];
            let failed = false;
            gridData.forEach(grid => {
                if (!failed) {
                    if (existingIds.includes(grid.id)) {
                        alert(translateService.translate('ERROR_IMPORT_SAMEID', grid.label));
                        failed = true;
                        return;
                    }
                    grid.label = modelUtil.getNewName(grid.label, existingNames);
                    grid._id = null;
                    grid._rev = null;
                    resolveFns.push(dataService.saveGrid(grid));
                }
            });
            Promise.all(resolveFns).then(() => {
                resolve();
            });
        });
    });
};

/**
 * saves an element that can potentially be used in several places, and has high data volume and therefore
 * should only be saved once in the database (e.g. images, ARE Models).
 * To achieve this the data of the element is hashed and the hashes are saved in the MetaData.hashes object. If another
 * element produces the same hash it isn't saved a second time to the database, but the id of the existing element is
 * returned and can be used as a reference to the element.
 *
 * @param objectType the objectType to save, e.g. GridImage
 * @param data the data to be saved
 * @return {Promise} the promise resolves either to the id of the data that was newly saved or to the id of the
 * existing object in the database with the same hash
 */
function saveHashedItemInternal(objectType, data) {
    let promises = [];
    return new Promise((resolve, reject) => {
        dataService.getMetadata().then(metadata => {
            if (!metadata || !metadata.hashCodes) {
                log.warn('error: hashCodes or metadata do not exist');
                reject();
                return;
            }
            let hashMap = null;
            if (metadata.hashCodes[objectType.getModelName()]) {
                hashMap = metadata.hashCodes[objectType.getModelName()];
            } else {
                hashMap = {};
                metadata.hashCodes[objectType.getModelName()] = hashMap;
            }
            let hash = modelUtil.hashCode(data);
            if (hashMap[hash]) {
                log.debug('saveHashedItemInternal: hash found, not saving new element');
                data.id = hashMap[hash];
            } else {
                log.debug('saveHashedItemInternal: hash not found, saving new element');
                hashMap[hash] = data.id;
                promises.push(databaseService.saveObject(objectType, data));
                promises.push(databaseService.saveObject(MetaData, metadata));
            }
            Promise.all(promises).then(() => {
                resolve(data.id);
            });
        });
    });
}

export {dataService};