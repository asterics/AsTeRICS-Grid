import $ from 'jquery';
import FileSaver from 'file-saver';

import {GridData} from "../../model/GridData.js";
import {GridImage} from "../../model/GridImage";
import {MetaData} from "../../model/MetaData";
import {modelUtil} from "../../util/modelUtil";
import {databaseService} from "./databaseService";
import {dataUtil} from "../../util/dataUtil";
import {pouchDbService} from "./pouchDbService";
import {Dictionary} from "../../model/Dictionary";
import {obfConverter} from "../../util/obfConverter";
import {fileUtil} from "../../util/fileUtil";
import {i18nService} from "../i18nService";
import {predictionService} from "../predictionService";
import {localStorageService} from "./localStorageService";
import {gridUtil} from "../../util/gridUtil";
import {urlParamService} from "../urlParamService";
import {filterService} from "./filterService";
import {InputConfig} from "../../model/InputConfig";

let dataService = {};

let _defaultGridSetPath = 'app/examples/default.grd.json';
if (urlParamService.getDefaultGridsetName()) {
    _defaultGridSetPath = 'app/examples/' + urlParamService.getDefaultGridsetName();
}

/**
 * gets a grid by ID.
 * @see{GridData}
 *
 * @param id the ID of the grid
 * @param onlyShortVersion if true only the short version (with stripped binary data) is returned (optional)
 * @return {Promise} resolves to a grid object that was found
 */
dataService.getGrid = async function (id, onlyShortVersion) {
    if (!id) {
        return Promise.resolve(null);
    }
    return databaseService.getSingleObject(GridData, id, onlyShortVersion).then(result => {
        return Promise.resolve(result ? new GridData(result) : null);
    });
};

/**
 * returns the global grid, if set, otherwise null
 * @param alsoReturnIfDeactivated if true the global grid is also returned if metadata.globalGridActive is not set
 * @return {Promise<unknown>}
 */
dataService.getGlobalGrid = function (alsoReturnIfDeactivated) {
    return dataService.getMetadata().then(metadata => {
        if (!metadata.globalGridId || (!alsoReturnIfDeactivated && !metadata.globalGridActive)) {
            return Promise.resolve(null);
        }
        return dataService.getGrid(metadata.globalGridId).then(globalGrid => {
            return Promise.resolve(globalGrid);
        });
    })
};

/**
 * Gets an array of all grids.
 * @see{GridData}
 *
 * @param fullVersion if true only the full version (with binary data) is returned (optional)
 * @param withoutGlobal if true the returned gridlist does not contain the global grid
 * @return {Promise} resolves to an array of all stored grids.
 */
dataService.getGrids = function (fullVersion, withoutGlobal) {
    return new Promise(resolve => {
        databaseService.getObject(GridData, null, !fullVersion).then(grids => {
            if (!grids) {
                resolve([]);
                return;
            }
            let retVal = grids instanceof Array ? grids : [grids];
            if (withoutGlobal) {
                dataService.getMetadata().then(metadata => {
                    resolve(retVal.filter(grid => grid.id !== metadata.globalGridId));
                })
            } else {
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
    gridData.gridElements = gridUtil.sortGridElements(gridData.gridElements);
    return databaseService.saveObject(GridData, gridData);
};

/**
 * saves a list of grids, using bulkSave. Faster performance but no check for existing grids
 * @param gridDataList the list of grids to save
 */
dataService.saveGrids = function (gridDataList) {
    gridDataList.forEach(gridData => {
        gridData.gridElements = gridUtil.sortGridElements(gridData.gridElements);
    });
    return databaseService.bulkSave(gridDataList);
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
    newConfig.gridElements = gridUtil.sortGridElements(newConfig.gridElements);
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
 * Deletes all grids.
 *
 * @return {Promise}
 */
dataService.deleteAllGrids = function () {
    return dataService.getGrids().then(grids => {
        if (!grids || grids.length === 0) {
            return Promise.resolve();
        }
        return databaseService.bulkDelete(grids);
    }).then(() => {
        return saveGlobalGridId('');
    });
};

/**
 * imports default gridset
 */
dataService.importDefaultGridset = function() {
    return Promise.resolve().then(() => {
        return $.get(_defaultGridSetPath);
    }).then(gridsData => {
        if (!gridsData) {
            return Promise.resolve();
        }
        log.info('importing default grid set ' + _defaultGridSetPath);
        try {
            gridsData = JSON.parse(gridsData);
        } catch (e) {}
        return dataService.importData(gridsData, false, true);
    });
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
            let element = grid.gridElements.filter(elm => elm.id === gridElementId)[0];
            if (element) {
                resolve(element);
            } else {
                dataService.getGlobalGrid().then(globalGrid => {
                    resolve(globalGrid.gridElements.filter(elm => elm.id === gridElementId)[0]);
                })
            }
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
        dataService.getGrids().then(grids => {
            let returnMap = {};
            grids.forEach(grid => {
                returnMap[grid.id] = grid[attribute];
            });
            resolve(returnMap);
        })
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
 * @param forceDbSave if set to true, metadata is saved to database, even if localStorageService.shouldSyncNavigation() is not set
 * @return {Promise} resolves after operation finished successful
 */
dataService.saveMetadata = function (newMetadata, forceDbSave) {
    newMetadata = JSON.parse(JSON.stringify(newMetadata));
    return new Promise(resolve => {
        dataService.getMetadata().then(existingMetadata => {
            if (existingMetadata) {
                //new metadata is stored with ID of existing metadata -> there should only be one metadata object
                let id = existingMetadata instanceof Array ? existingMetadata[0].id : existingMetadata.id;
                newMetadata.id = id;
                localStorageService.saveLocalMetadata(newMetadata);
                if (!localStorageService.shouldSyncNavigation() && !forceDbSave) {
                    newMetadata.locked = existingMetadata.locked;
                    newMetadata.fullscreen = existingMetadata.fullscreen;
                    newMetadata.lastOpenedGridId = existingMetadata.lastOpenedGridId;
                }
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
            let returnValue = null;
            if (!result) {
                returnValue = new MetaData();
            } else if (result instanceof Array) {
                returnValue = result[0];
            } else {
                returnValue = result;
            }
            if (!localStorageService.shouldSyncNavigation()) {
                let localMetadata = localStorageService.getLocalMetadata();
                if (localMetadata) {
                    returnValue.locked = localMetadata.locked;
                    returnValue.fullscreen = localMetadata.fullscreen;
                    returnValue.lastOpenedGridId = localMetadata.lastOpenedGridId;
                }
            }
            resolve(new MetaData(returnValue));
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
 * gets a dictionary by ID.
 * @see{GridData}
 *
 * @param id the ID of the dictionary
 * @return {Promise} resolves to a dictionary object that was found
 */
dataService.getDictionary = function (id) {
    if (!id) {
        return Promise.resolve(null);
    }
    return databaseService.getSingleObject(Dictionary, id).then(result => {
        return Promise.resolve(new Dictionary(result));
    });
};

/**
 * Gets an array of all dictionaries.
 * @see{GridData}
 *
 * @return {Promise} resolves to an array of all stored dictionaries.
 */
dataService.getDictionaries = function () {
    return new Promise(resolve => {
        databaseService.getObject(Dictionary).then(dictionaries => {
            if (!dictionaries) {
                resolve([]);
                return;
            }
            let retVal = dictionaries instanceof Array ? dictionaries.map(dict => new Dictionary(dict)) : [new Dictionary(dictionaries)];
            resolve(retVal);
        });
    });
};

/**
 * Saves a dictionary or updates it, if existing.
 * @see{GridData}
 *
 * @param dictionaryData the Dictionary data to save/update
 * @return {Promise} resolves after operation finished successful
 */
dataService.saveDictionary = function (dictionaryData) {
    dictionaryData.isDefault = false;
    return databaseService.saveObject(Dictionary, dictionaryData);
};

/**
 * Deletes any kind of object directly saved in the database (e.g. GridData, Dictionary, ...)
 *
 * @param id the ID of the object to delete.
 * @return {Promise}
 */
dataService.deleteObject = function (id) {
    return databaseService.removeObject(id);
};

/**
 * Downloads to a single grid to File. Opens a file download in Browser.
 * @param gridId the ID of the grid to download
 */
dataService.downloadSingleGrid = function (gridId) {
    dataService.getGrid(gridId).then(gridData => {
        if (gridData) {
            let blob = new Blob([JSON.stringify(gridData)], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, i18nService.getTranslation(gridData.label) + ".grd");
        }
    });
};

/**
 * Downloads all grids, dictionaries and metadata to File. Opens a file download in Browser.
 */
window.backupPrepareForDefault = false;
dataService.downloadBackup = function () {
    let exportData = {};
    let promises = [];
    promises.push(dataService.getMetadata().then(metadata => {
        exportData.metadata = metadata;
        return Promise.resolve();
    }));
    promises.push(dataService.getDictionaries().then(dictionaries => {
        let allDefault = dictionaries.reduce((total, current) => {
            return total && current.isDefault;
        }, true);
        if (!allDefault) {
            exportData.dictionaries = dictionaries;
        }
        return Promise.resolve();
    }));
    promises.push(dataService.getGrids(true).then(grids => {
        exportData.grids = grids;
        return Promise.resolve();
    }));
    Promise.all(promises).then(() => {
        if (backupPrepareForDefault) {
            delete exportData.dictionaries;
            exportData.metadata.inputConfig = new InputConfig();
            exportData.metadata.locked = undefined;
            exportData.metadata.fullscreen = undefined;
            exportData.metadata.hashCodes = {};
        }
        let blob = new Blob([JSON.stringify(exportData)], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, "my-backup.grd");
    });
};

/**
 * logs a simple version of all grids without base64 contents to console => used for legacy mode
 */
dataService.downloadAllGridsSimple = function () {
    dataService.getGrids(true).then(grids => {
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
 * @param backupMode if true all grids are deleted before importing the file -> restoring a backup. if false
 *        grids from file are imported in addition to existing grids.
 * @param progressFn a function where current progress is reported. passed parameters: <percentage:Number, text:String>
 * @return {Promise} resolves after operation finished successful
 */
dataService.importGridsFromFile = function (file, backupMode, progressFn) {
    let fileExtension = file.name.substring(file.name.length - 4);
    let generateGlobalGrid = false;
    progressFn = progressFn || function (){};
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                let jsonString = e.target.result;
                let promises = [];
                if (backupMode) {
                    progressFn(10, i18nService.translate('Deleting grids // Grids werden gelöscht'));
                    promises.push(dataService.deleteAllGrids());
                }
                Promise.all(promises).then(() => {
                    let importObjects = null;
                    let promises = [];
                    progressFn(40, i18nService.translate('Extracting grids from file //  Grids werden aus Datei extrahiert'));
                    if (fileExtension === '.grd') {
                        importObjects = JSON.parse(jsonString);
                    } else if (fileExtension === '.obf') {
                        promises.push(obfConverter.OBFToGridData(JSON.parse(jsonString)).then(object => {
                            importObjects = object;
                            return Promise.resolve();
                        }));
                    } else if (fileExtension === '.obz') {
                        let promise = fileUtil.readZip(file, true).then(obzFileMap => {
                            return obfConverter.OBZToGridSet(obzFileMap);
                        }).then(list => {
                            importObjects = list;
                            if (backupMode) {
                                generateGlobalGrid = true;
                            }
                            return Promise.resolve();
                        });
                        promises.push(promise);
                    }
                    Promise.all(promises).then(() => {
                        progressFn(80, i18nService.translate('Encrypting and saving grids to database // Grids werden verschlüsselt und in Datenbank gespeichert'));
                        dataService.importData(importObjects, generateGlobalGrid, backupMode).then(() => {
                            progressFn(100);
                            resolve();
                        });
                    });
                });
            }
        })(file);
        reader.readAsText(file);
    });
};

/**
 * imports data from given JSON object
 * @see{GridData}
 *
 * @param data a single GridData element, list of GridData elements or object containing grids, dictionaries, metadata
 * @param generateGlobalGrid if true a global grid is generated
 * @param backupMode if true, dictionaries and metadata will be imported, otherwise not
 * @param translate if true, the imported grids are tried to translate using the files in folder "translations"
 * @return {Promise} resolves after operation finished successful
 */
dataService.importData = function (data, generateGlobalGrid, backupMode) {
    if (!data || data.length === 0) {
        return Promise.resolve();
    }
    let importDictionaries = null;
    let importMetadata = null;
    let importGrids = null;
    let promises = [];
    let metadataPromise = null;

    if (!(data instanceof Array)) {
        importDictionaries = backupMode ? filterService.updateDataModel(data.dictionaries) : null;
        importMetadata = backupMode ? filterService.updateDataModel(data.metadata) : null;
        importGrids = filterService.updateDataModel(data.grids);
        if (!importDictionaries && !importMetadata && !importGrids && data.id) {
            importGrids = [filterService.updateDataModel(data)];
        }
    } else {
        importGrids = filterService.updateDataModel(data);
    }

    if (importMetadata) {
        metadataPromise = Promise.resolve(importMetadata);
    } else {
        metadataPromise = dataService.getMetadata();
    }
    return metadataPromise.then(metadata => {
        if (importGrids) {
            promises.push(dataService.getGrids().then(grids => {
                let existingNames = grids.map(grid => i18nService.getTranslation(grid.label));
                let globalGrid = null;
                let regenerateIdsReturn = gridUtil.regenerateIDs(importGrids);
                importGrids = regenerateIdsReturn.grids;
                if (importMetadata) {
                    metadata.lastOpenedGridId = regenerateIdsReturn.idMapping[metadata.lastOpenedGridId];
                    metadata.globalGridId = regenerateIdsReturn.idMapping[metadata.globalGridId];
                }
                importGrids.forEach(grid => {
                    let label = i18nService.getTranslation(grid.label);
                    grid.label[i18nService.getBrowserLang()] = modelUtil.getNewName(label, existingNames);
                });
                let locale = importGrids[0] ? importGrids[0].locale : null;
                if (generateGlobalGrid) {
                    let homeGridId = importGrids[0].id;
                    globalGrid = gridUtil.generateGlobalGrid(homeGridId, locale);
                    importGrids.unshift(globalGrid);
                    metadata.globalGridId = globalGrid.id;
                    metadata.globalGridActive = !!metadata.globalGridId;
                }
                return dataService.saveGrids(importGrids).then(() => {
                    return dataService.saveMetadata(metadata, true);
                });
            }));
        }
        if (importDictionaries) {
            promises.push(dataService.getDictionaries().then(dictionaries => {
                return databaseService.bulkDelete(dictionaries);
            }).then(() => {
                importDictionaries = importDictionaries.map(dict => {
                    delete dict.id;
                    delete dict._id;
                    delete dict._rev;
                    return new Dictionary(dict);
                });
                return databaseService.bulkSave(importDictionaries).then(() => {
                    predictionService.init();
                    return Promise.resolve();
                });
            }));
        }
        return Promise.all(promises);
    });
};

/**
 * @see pouchDbService.getSyncState()
 * @return {*}
 */
dataService.getSyncState = function () {
    return pouchDbService.getSyncState();
};

/**
 * returns the current active username (= database name)
 * @return {*}
 */
dataService.getCurrentUser = function () {
    return databaseService.getCurrentUsedDatabase();
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

function saveGlobalGridId(globalGridId) {
    return dataService.getMetadata().then(metadata => {
        metadata.globalGridId = globalGridId;
        metadata.globalGridActive = !!globalGridId;
        return dataService.saveMetadata(metadata);
    })
}

export {dataService};