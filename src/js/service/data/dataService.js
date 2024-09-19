import $ from '../../externals/jquery.js';
import FileSaver from 'file-saver';

import { GridData } from '../../model/GridData.js';
import { MetaData } from '../../model/MetaData';
import { modelUtil } from '../../util/modelUtil';
import { databaseService } from './databaseService';
import { dataUtil } from '../../util/dataUtil';
import { pouchDbService } from './pouchDbService';
import { Dictionary } from '../../model/Dictionary';
import { obfConverter } from '../../util/obfConverter';
import { fileUtil } from '../../util/fileUtil';
import { i18nService } from '../i18nService';
import { predictionService } from '../predictionService';
import { localStorageService } from './localStorageService';
import { gridUtil } from '../../util/gridUtil';
import { convertServiceDb } from './convertServiceDb';
import { serviceWorkerService } from '../serviceWorkerService.js';
import { constants } from '../../util/constants.js';
import { MainVue } from '../../vue/mainVue.js';
import { util } from '../../util/util.js';
import { externalBoardsService } from '../boards/externalBoardsService';

let dataService = {};

/**
 * gets a grid by ID.
 * @see{GridData}
 *
 * @param id the ID of the grid
 * @param onlyShortVersion if true only the short version (with stripped binary data) is returned (optional)
 * @return {Promise} resolves to a grid object that was found
 */
dataService.getGrid = async function (id, onlyShortVersion = false) {
    if (!id) {
        return Promise.resolve(null);
    }
    return databaseService.getSingleObject(GridData, id, onlyShortVersion).then((result) => {
        return Promise.resolve(result ? new GridData(result) : null);
    });
};

/**
 * returns the global grid, if set, otherwise null
 * @param alsoReturnIfDeactivated if true the global grid is also returned if metadata.globalGridActive is not set
 * @return {Promise<unknown>}
 */
dataService.getGlobalGrid = function (alsoReturnIfDeactivated) {
    return dataService.getMetadata().then((metadata) => {
        if (!metadata.globalGridId || (!alsoReturnIfDeactivated && !metadata.globalGridActive)) {
            return Promise.resolve(null);
        }
        return dataService.getGrid(metadata.globalGridId).then((globalGrid) => {
            return Promise.resolve(globalGrid);
        });
    });
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
    return new Promise((resolve) => {
        databaseService.getObject(GridData, null, !fullVersion).then((grids) => {
            if (!grids) {
                resolve([]);
                return;
            }
            let retVal = grids instanceof Array ? grids : [grids];
            if (withoutGlobal) {
                dataService.getMetadata().then((metadata) => {
                    resolve(retVal.filter((grid) => grid && grid.id !== metadata.globalGridId));
                });
            } else {
                resolve(retVal.filter((grid) => !!grid));
            }
        });
    });
};

dataService.getGridsGraphList = async function() {
    let grids = await dataService.getGrids(false, true);
    let homeGridId = (await dataService.getMetadata()).homeGridId;
    let graphList = gridUtil.getGraphList(grids);
    graphList.sort((a, b) => {
        if (a.grid.id === homeGridId) return -1;
        if (b.grid.id === homeGridId) return 1;
    });
    return graphList;
}

/**
 * get the unix time (in ms) when the last update of a grid was made
 * @return {Promise<number|number>} the time of the latest update of all grids
 *                                  0 if there wasn't any update yet or previous updates weren't recorded
 *                                  undefined if there are no grids in the current configuration
 */
dataService.getLastGridUpdateTime = async function () {
    let grids = await dataService.getGrids(false, false);
    if (grids.length === 0) {
        return undefined;
    }
    let updateTimes = grids.map((grid) => grid.lastUpdateTime).filter((time) => Number.isInteger(time));
    return updateTimes.length > 0 ? Math.max(...updateTimes) : 0;
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
    gridData.lastUpdateTime = new Date().getTime();
    return databaseService.saveObject(GridData, gridData);
};

/**
 * saves a list of grids, using bulkSave. Faster performance but no check for existing grids
 * @param gridDataList the list of grids to save
 */
dataService.saveGrids = function (gridDataList) {
    gridDataList.forEach((gridData) => {
        gridData.gridElements = gridUtil.sortGridElements(gridData.gridElements);
        gridData.lastUpdateTime = new Date().getTime();
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
    newConfig.lastUpdateTime = new Date().getTime();
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
    $(document).trigger(constants.EVENT_CONFIG_RESET);
    return dataService
        .getGrids()
        .then((grids) => {
            if (!grids || grids.length === 0) {
                return Promise.resolve();
            }
            return databaseService.bulkDelete(grids);
        })
        .then(() => {
            localStorageService.saveUserSettings({originGridsetFilename: '', isEmpty: true}, localStorageService.getAutologinUser());
            return saveGlobalGridId('');
        });
};

/**
 * deletes all dictionaries
 * @return {Promise<void>}
 */
dataService.deleteAllDictionaries = async function () {
    let dicts = await dataService.getDictionaries();
    if (dicts && dicts.length > 0) {
        await databaseService.bulkDelete(dicts);
    }
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
    return new Promise((resolve) => {
        dataService.getGrid(gridId).then((grid) => {
            let element = grid.gridElements.filter((elm) => elm.id === gridElementId)[0];
            if (element) {
                resolve(element);
            } else {
                dataService.getGlobalGrid().then((globalGrid) => {
                    resolve(globalGrid.gridElements.filter((elm) => elm.id === gridElementId)[0]);
                });
            }
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
    return new Promise((resolve) => {
        dataService.getGrid(gridId).then((grid) => {
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
dataService.saveMetadata = async function(newMetadata) {
    newMetadata = JSON.parse(JSON.stringify(newMetadata));
    let updated = false;
    let existingMetadata = await dataService.getMetadata();
    if (existingMetadata) {
        //new metadata is stored with ID of existing metadata -> there should only be one metadata object
        let id = existingMetadata instanceof Array ? existingMetadata[0].id : existingMetadata.id;
        newMetadata.id = id;
    }
    if (!existingMetadata.isEqual(newMetadata)) {
        localStorageService.saveUserSettings({ metadata: newMetadata });
        updated = true;
    }
    if (!localStorageService.getAppSettings().syncNavigation) {
        newMetadata.locked = existingMetadata.locked;
        newMetadata.fullscreen = existingMetadata.fullscreen;
        newMetadata.lastOpenedGridId = existingMetadata.lastOpenedGridId;
    }
    if (!existingMetadata.isEqual(newMetadata)) {
        await databaseService.saveObject(MetaData, newMetadata);
        updated = true;
    }
    if (updated) {
        $(document).trigger(constants.EVENT_METADATA_UPDATED, newMetadata);
    }
};

/**
 * set "lastBackup" time in metadata.notificationConfig to current time in order to
 * indicate that no additional backup is needed.
 *
 * @return {Promise<void>}
 */
dataService.markCurrentConfigAsBackedUp = async function () {
    let metadata = await dataService.getMetadata();
    metadata.notificationConfig.lastBackup = new Date().getTime();
    await dataService.saveMetadata(metadata);
};

/**
 * Retrieves the metadata object.
 * @see{MetaData}
 *
 * @return {Promise} resolving with the metadata object as parameter
 */
dataService.getMetadata = function () {
    return new Promise((resolve) => {
        databaseService.getObject(MetaData).then((result) => {
            let returnValue = null;
            if (!result) {
                returnValue = new MetaData();
            } else if (Array.isArray(result)) {
                result.sort((a, b) => a.id.localeCompare(b.id)); // always prefer older metadata objects
                returnValue = result[0];
            } else {
                returnValue = result;
            }
            if (!localStorageService.getAppSettings().syncNavigation) {
                let localMetadata = localStorageService.getUserSettings().metadata;
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
    return databaseService.getSingleObject(Dictionary, id).then((result) => {
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
    return new Promise((resolve) => {
        databaseService.getObject(Dictionary).then((dictionaries) => {
            if (!dictionaries) {
                resolve([]);
                return;
            }
            let retVal =
                dictionaries instanceof Array
                    ? dictionaries.map((dict) => new Dictionary(dict))
                    : [new Dictionary(dictionaries)];
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
 * Downloads a complete backup of the current user config to file
 * @return {Promise<void>}
 */
dataService.downloadBackupToFile = async function () {
    let grids = await dataService.getGrids();
    let ids = grids.map((grid) => grid.id);
    let user = localStorageService.getAutologinUser();
    await dataService.downloadToFile(ids, {
        exportGlobalGrid: true,
        exportOnlyCurrentLang: false,
        exportDictionaries: true,
        exportUserSettings: true,
        filename: `${user}_${util.getCurrentDateTimeString()}_asterics-grid-full-backup`
    });
};

/**
 * get configuration data for downloading
 * @param gridIds array of gridIds to export
 * @param options options for exporting
 * @param options.exportGlobalGrid if true, the global grid is exported (if existing and enabled)
 * @param options.exportOnlyCurrentLang if true, only the current content language is exported
 * @param options.exportDictionaries if true, all user dictionaries are exported
 * @param options.exportUserSettings if true, all user settings are exported
 * @param options.filename the filename to use for downloading
 * @param options.obzFormat if true, data is returned in obz format (as blob)
 * @param options.obzFileMap if true, data is returned in obz format (as map of files)
 * @param options.progressFn fn for reporting progress, called with params percentage and text
 * @returns {Promise<{}|null>} promise resolving to a javascript object containing native AG backup data or to a blob
 *                             containing the backup in .obz format if options.obzFormat is true.
 */
dataService.getBackupData = async function (gridIds, options = {}) {
    if (!gridIds || gridIds.length === 0) {
        return null;
    }
    options.progressFn = options.progressFn || (() => {});
    let backupData = {};
    options = options || {};
    let globalGridId = null;
    if (options.exportGlobalGrid) {
        let globalGrid = await dataService.getGlobalGrid();
        globalGridId = globalGrid ? globalGrid.id : null;
    }
    options.progressFn(10, i18nService.t('retrievingGrids'));
    let allGrids = await dataService.getGrids(true, !options.exportGlobalGrid);
    backupData.grids = allGrids.filter((grid) => gridIds.includes(grid.id) || globalGridId === grid.id);
    if (options.exportOnlyCurrentLang) {
        let contentLang = i18nService.getContentLang();
        let contentLangBase = i18nService.getContentLangBase();
        for (let grid of backupData.grids) {
            grid.label[contentLang] = grid.label[contentLang] || grid.label[contentLangBase];
            Object.keys(grid.label).forEach((key) => key === contentLang || delete grid.label[key]);
            for (let elem of grid.gridElements) {
                elem.label[contentLang] = elem.label[contentLang] || elem.label[contentLangBase];
                Object.keys(elem.label).forEach((key) => key === contentLang || delete elem.label[key]);
                for (let action of elem.actions) {
                    if (action.speakText) {
                        Object.keys(action.speakText).forEach(
                            (key) => key === contentLang || delete action.speakText[key]
                        );
                    }
                }
            }
        }
    }
    if (options.exportDictionaries) {
        backupData.dictionaries = await dataService.getDictionaries();
    }

    let currentMetadata = await dataService.getMetadata();
    if (options.exportUserSettings) {
        backupData.metadata = currentMetadata;
    } else if (backupData.grids.map((grid) => grid.id).includes(globalGridId)) {
        backupData.metadata = {};
        backupData.metadata.globalGridId = globalGridId;
        backupData.metadata.lastOpenedGridId = currentMetadata.lastOpenedGridId;
    }
    if (options.obzFormat) {
        options.progressFn(10, i18nService.t('convertingToOBZ'));
        backupData = await obfConverter.backupDataToOBZ(backupData, {
            progressFn: (zipProgress => {
                options.progressFn(10 + util.mapRange(zipProgress, 0, 100, 0, 90));
            })
        });
    }
    if (options.obzFileMap) {
        backupData = await obfConverter.backupDataToOBZFileMap(backupData);
    }
    options.progressFn(100);
    return backupData;
}

/**
 * get backup data for all grids, no need for passing IDs of grids
 * @param options see #dataService.getBackupData()
 */
dataService.getBackupDataAllGrids = async function(options) {
    let grids = await dataService.getGrids();
    let ids = grids.map((grid) => grid.id);
    return dataService.getBackupData(ids, options);
}

/**
 * export configuration to file
 * @param gridIds array of gridIds to export
 * @param options options for exporting
 * @param options.exportGlobalGrid if true, the global grid is exported (if existing and enabled)
 * @param options.exportOnlyCurrentLang if true, only the current content language is exported
 * @param options.exportDictionaries if true, all user dictionaries are exported
 * @param options.exportUserSettings if true, all user settings are exported
 * @param options.filename the base filename to use for downloading (without file extension)
 * @param options.obzFormat if true, data is downloaded in obz format
 * @param options.progressFn fn for reporting progress, called with params percentage and text
 * @return {Promise<void>}
 */
dataService.downloadToFile = async function (gridIds, options = {}) {
    let backupData = await dataService.getBackupData(gridIds, options);
    if (!backupData) {
        return;
    }

    let blob = backupData;
    let postfix = '.obz';
    if (!options.obzFormat) {
        blob = new Blob([JSON.stringify(backupData)], { type: 'text/plain;charset=utf-8' });
        postfix = '.grd';
    }
    let filenameBase =
        options.filename ||
        (backupData.grids.length > 1
            ? `asterics-grid-backup`
            : i18nService.getTranslation(backupData.grids[0].label));
    let filename = filenameBase + postfix;
    FileSaver.saveAs(blob, filename);
};

/**
 * converts a file (.grd, .obf, .obz) to standardized import data
 * @param file
 * @param options
 * @return {Promise<null>}
 */
dataService.convertFileToImportData = async function (file, options = {}) {
    options.progressFn = options.progressFn || (() => {});
    let fileContent = await fileUtil.readFileContent(file);
    let importData = null;
    if (!fileContent) {
        return null;
    }
    if (fileUtil.isGrdFile(file)) {
        try {
            importData = JSON.parse(fileContent);
        } catch (e) {
            log.warn("couldn't parse import data");
            return null;
        }
        if (!importData || (!importData.grids && !importData.metadata && !importData.dictionaries)) {
            log.warn("data doesn't contain AsTeRICS Grid config");
            return null;
        }
    } else if (fileUtil.isObfFile(file)) {
        importData = await obfConverter.OBFToGridData(JSON.parse(fileContent));
    } else if (fileUtil.isObzFile(file)) {
        let obzFileMap = await fileUtil.readZip(file, {
            jsonFileExtensions: ["json", "obf"],
            defaultEncoding: "base64",
            progressFn: options.progressFn
        });
        importData = await obfConverter.OBZToImportData(obzFileMap);
    }
    return dataService.normalizeImportData(importData);
};

dataService.normalizeImportData = function (data) {
    if (!data || data.length === 0) {
        return {};
    }
    let importData = {};
    if (data instanceof Array) {
        // array of grids
        importData.grids = data;
    } else if (!data.grids && data.id) {
        // single grid
        importData.grids = [data];
    } else {
        importData = data;
    }

    importData.grids = importData.grids || [];
    importData.dictionaries = importData.dictionaries || [];
    importData.grids = convertServiceDb.updateDataModel(importData.grids);
    importData.dictionaries = convertServiceDb.updateDataModel(importData.dictionaries);
    if (importData.metadata) {
        importData.metadata = convertServiceDb.updateDataModel(importData.metadata);
    }
    importData.metadata = importData.metadata || {};
    return importData;
};

dataService.importBackupUploadedFile = async function (file, progressFn) {
    progressFn = progressFn || (() => {});
    progressFn(10, i18nService.t('extractingGridsFromFile'));
    let importData = await dataService.convertFileToImportData(file, {
        progressFn: progress => {
            progressFn(10 + util.mapRange(progress, 0, 100, 0, 10));
        }
    });
    if (!importData) {
        progressFn(100);
        MainVue.setTooltip(i18nService.t('backupFileDoesntContainData'), { msgType: 'warn' });
        return;
    }
    return dataService.importBackupData(importData, {
        progressFn: progressFn,
        generateGlobalGrid: fileUtil.isObzFile(file)
    });
};

/**
 * imports board data related to a given preview
 * @param preview
 * @param options
 * @return {Promise<Boolean>} true, if successful, otherwise false
 */
dataService.importBackupFromPreview = async function(preview, options = {}) {
    options.progressFn = options.progressFn || (() => {});
    if (!preview) {
        showErrorTooltip('failedToFindExternalConfig');
        return false;
    }
    if (preview.languages.length > 0 && !preview.languages.includes(i18nService.getContentLang())) {
        await i18nService.setContentLanguage(preview.languages[0]);
    }
    options.filename = options.filename || (preview.providerName + preview.id);
    options.skipDelete = true;
    options.progressFn(10, i18nService.t('downloadingConfig'));
    options.generateGlobalGrid = !preview.hasGlobalGrid;
    options.resetHomeBoard = !preview.hasGlobalGrid;
    let result = await externalBoardsService.getImportData(preview);
    if (!result) {
        showErrorTooltip('failedToGetBoardData');
        return false;
    }
    options.progressFn(50, i18nService.t('importingData'));
    if (preview.translate && result.grids) {
        for (let grid of result.grids) {
            grid.label[i18nService.getContentLang()] = i18nService.t(i18nService.getTranslation(grid.label));
            for (let element of grid.gridElements) {
                element.label[i18nService.getContentLang()] = i18nService.t(i18nService.getTranslation(element.label));
            }
        }
    }
    await dataService.importBackupData(result, options);
    return true;

    function showErrorTooltip(msg) {
        options.progressFn(100);
        let providerName = preview ? preview.providerName : '';
        MainVue.setTooltip(i18nService.t(msg, providerName), {
            msgType: 'warn',
            timeout: 20000,
            closeOnNavigate: false
        });
    }
}

dataService.importExternalBackup = async function(provider, id) {
    let preview = await externalBoardsService.getPreview(provider, id);
    return dataService.importBackupFromPreview(preview);
}

/**
 * deletes current config and imports data from backup
 * @param importData
 * @param options also see options of dataService.importData
 * @param options.skipDelete skip deleting existing data (fresh import for new user)
 * @param options.filename original filename of the imported data - is saved to recognize which user has which default gridset
 * @param options.generateGlobalGrid if true a default global grid is generated
 * @param options.resetHomeBoard if true don't trust in existing home board ID in given metadata, but reset home board ID to the most likely home board
 * @return {Promise<void>}
 */
dataService.importBackupData = async function (importData, options) {
    options = options || {};
    options.progressFn = options.progressFn || (() => {});
    options.filename = options.filename || '';
    if (!options.skipDelete) {
        options.progressFn(20, i18nService.t('deletingGrids'));
        await dataService.deleteAllGrids();
        await dataService.deleteAllDictionaries();
    }
    localStorageService.saveUserSettings({originGridsetFilename: options.filename, isEmpty: false}, localStorageService.getAutologinUser());
    options.progressFn(30, i18nService.t('encryptingAndSavingGrids'));
    await dataService.importData(importData, {
        generateGlobalGrid: options.generateGlobalGrid,
        resetHomeBoard: options.resetHomeBoard,
        importDictionaries: true,
        importUserSettings: true,
        progressFn: (p) => {
            options.progressFn(30 + (p / 100) * 70);
        }
    });

    await dataService.markCurrentConfigAsBackedUp();
    if (importData.grids && importData.grids.length) {
        let contentLang = gridUtil.getGridsContentLang(importData.grids, i18nService.getContentLang());
        await i18nService.setContentLanguage(contentLang);
    }
    options.progressFn(100);
};

/**
 * imports data from given JSON object
 * @see{GridData}
 *
 * @param data a single GridData element, list of GridData elements or object containing grids, dictionaries, metadata
 * @param options options for import
 * @param options.generateGlobalGrid if true a global grid is generated, if not already existing in the data
 * @param options.importDictionaries if true, dictionaries are imported
 * @param options.importUserSettings if true, user settings are imported
 * @param options.progressFn an optional function where the current progress in percentage is returned
 * @param options.resetBeforeImport info about if data was reset before import, reset not happening in this method!
 * @param options.resetHomeBoard if true don't trust in existing home board ID in given metadata, but reset home board ID to the most likely home board
 * @return {Promise} resolves after operation finished successful
 */
dataService.importData = async function (data, options) {
    if (!data || data.length === 0) {
        return Promise.resolve();
    }
    options = options || {};
    options.progressFn = options.progressFn || (() => {});
    options.progressFn(0);
    let importData = dataService.normalizeImportData(data);
    dataUtil.removeDatabaseProperties(importData.grids);
    dataUtil.removeDatabaseProperties(importData.dictionaries, true);
    dataUtil.removeDatabaseProperties(importData.metadata, true);
    options.progressFn(10);
    let existingGrids = await dataService.getGrids();
    let existingMetadata = await dataService.getMetadata();
    let existingNames = existingGrids.map((grid) => i18nService.getTranslation(grid.label));
    let regenerateIdsReturn = gridUtil.regenerateIDs(importData.grids);
    importData.grids = regenerateIdsReturn.grids;
    if (importData.metadata && (importData.metadata.lastOpenedGridId || importData.metadata.globalGridId || importData.metadata.homeGridId)) {
        importData.metadata.lastOpenedGridId = regenerateIdsReturn.idMapping[importData.metadata.lastOpenedGridId];
        importData.metadata.globalGridId = regenerateIdsReturn.idMapping[importData.metadata.globalGridId];
        importData.metadata.homeGridId = regenerateIdsReturn.idMapping[importData.metadata.homeGridId] || null;
    }
    importData.grids.forEach((grid) => {
        let label = i18nService.getTranslation(grid.label);
        grid.label[i18nService.getContentLang()] = modelUtil.getNewName(label, existingNames);
    });
    options.progressFn(20);
    if (options.generateGlobalGrid && !importData.metadata.globalGridId) {
        let globalGrid = gridUtil.generateGlobalGrid(i18nService.getContentLang());
        importData.grids.unshift(globalGrid);
        importData.metadata.globalGridId = globalGrid.id;
    }

    if (options.importUserSettings) {
        importData.metadata = Object.assign(await dataService.getMetadata(), importData.metadata);
    } else if (
        options.resetBeforeImport &&
        importData.metadata &&
        (importData.metadata.globalGridId || importData.metadata.lastOpenedGridId)
    ) {
        existingMetadata.globalGridId = importData.metadata.globalGridId;
        existingMetadata.lastOpenedGridId = importData.metadata.lastOpenedGridId;
        importData.metadata = existingMetadata;
    }

    await dataService.saveGrids(JSON.parse(JSON.stringify(importData.grids)));
    options.progressFn(70);
    if (importData.metadata) {
        importData.metadata.globalGridActive = !!importData.metadata.globalGridId;
        await dataService.saveMetadata(importData.metadata);
        existingMetadata = Object.assign(existingMetadata, importData.metadata);
    }
    if (options.resetHomeBoard) {
        let globalGridId = importData.metadata ? importData.metadata.globalGridId : null;
        let graphList = gridUtil.getGraphList(importData.grids, globalGridId);
        existingMetadata.homeGridId = graphList[0].grid.id;
        await dataService.saveMetadata(existingMetadata);
    }
    options.progressFn(80);

    if (options.importDictionaries && importData.dictionaries) {
        let existingDicts = await dataService.getDictionaries();
        let existingNames = existingDicts.map((d) => d.dictionaryKey);
        for (let dict of importData.dictionaries) {
            dict.dictionaryKey = modelUtil.getNewName(dict.dictionaryKey, existingNames);
        }
        importData.dictionaries = importData.dictionaries.map((dict) => new Dictionary(dict));
        await databaseService.bulkSave(importData.dictionaries);
        predictionService.init();
    }

    log.debug('pre-caching all images of gridset ...');
    serviceWorkerService.cacheImagesOfGrids(importData.grids);
    options.progressFn(100);
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
 * caches all the images of all grids of the current configuration
 * in the ServiceWorker cache
 * @return {Promise<void>}
 */
dataService.cacheAllImages = async function () {
    let grids = await dataService.getGrids();
    serviceWorkerService.cacheImagesOfGrids(grids);
};

function saveGlobalGridId(globalGridId) {
    return dataService.getMetadata().then((metadata) => {
        metadata.globalGridId = globalGridId;
        metadata.globalGridActive = !!globalGridId;
        return dataService.saveMetadata(metadata);
    });
}

window.setGlobalGridId = saveGlobalGridId;

/**
 * move translation from fallbackLang to lang, if translation of lang is empty
 * @param langCode
 * @param fallbackLangCode
 * @returns {Promise<void>}
 */
async function fillEmptyTranslations(langCode, fallbackLangCode) {
    if (langCode?.length !== 2 && fallbackLangCode?.length !== 2) {
        console.log('invalid params');
        return;
    }
    let allGrids = await dataService.getGrids(true, false);
    let originalJSON = JSON.stringify(allGrids);
    for (let grid of allGrids) {
        grid.label[langCode] = grid.label[langCode] || grid.label[fallbackLangCode];
        for (let element of grid.gridElements) {
            element.label[langCode] = element.label[langCode] || element.label[fallbackLangCode];
        }
    }
    if (originalJSON !== JSON.stringify(allGrids)) {
        await dataService.saveGrids(allGrids);
        console.log('updated all grids!');
    } else {
        console.log('nothing updated.');
    }
}

window.fillEmptyTranslations = fillEmptyTranslations;

$(document).on(constants.EVENT_DB_INITIAL_SYNC_COMPLETE, () => {
    dataService.cacheAllImages();
});

export { dataService };
