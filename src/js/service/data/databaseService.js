import $ from 'jquery';

import {GridData} from "../../model/GridData.js";
import {urlParamService} from "../urlParamService";
import {MetaData} from "../../model/MetaData";
import {encryptionService} from "./encryptionService";
import {pouchDbService} from "./pouchDbService";
import {filterService} from "./filterService";

let databaseService = {};

let _initPromise = null;
let _defaultGridSetPath = 'examples/default.grd';

/**
 * queries for objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @param onlyShortVersion if true only the short version (with stripped binary data) is returned (optional)
 * @return {Promise}
 */
databaseService.getObject = function (objectType, id, onlyShortVersion) {
    return new Promise((resolve, reject) => {
        _initPromise.then(() => {
            pouchDbService.query(objectType, id).then(result => {
                let options = {
                    objectType: objectType,
                    onlyShortVersion: onlyShortVersion
                };
                let filteredData = filterService.convertDatabaseToLiveObjects(result, options);
                resolve(filteredData);
            }).catch(reason => {
                reject(reason);
            })
        });
    });
};

/**
 * Saves an object to database.
 *
 * @param objectType the objectType to save, e.g. "GridData"
 * @param data the data object to save, must be valid object, not only single properties to update
 * @param onlyUpdate if true no new object is created but only an existing updated. If onlyUpdate==true and there is no
 *        existing object with the same ID, nothing is done. If onlyUpdate==false a new object is created if no object
 *        with the same ID exists.
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
databaseService.saveObject = function (objectType, data, onlyUpdate) {
    return _initPromise.then(() => {
        if (!data || !objectType || !objectType.getModelName) {
            log.error('did not specify needed parameter "objectType"!');
            return Promise.reject();
        }
        if (data.isShortVersion) {
            log.warn('short versions of objects cannot be saved/updated! aborting.');
            return Promise.reject();
        }
        log.debug('saving ' + objectType.getModelName() + '...');
        return databaseService.getObject(objectType, data.id);
    }).then(existingObject => {
        if (existingObject) {
            log.debug(objectType.getModelName() + ' already existing, doing update. id: ' + existingObject.id);
            let newObject = new objectType(data, existingObject);
            let saveData = JSON.parse(JSON.stringify(newObject));
            saveData._id = existingObject._id;
            saveData._rev = existingObject._rev;
            return applyFiltersAndSave(objectType, saveData);
        } else if (!onlyUpdate) {
            let saveData = JSON.parse(JSON.stringify(data));
            saveData._id = saveData.id;
            return applyFiltersAndSave(objectType, saveData);
        } else {
            log.warn('no existing ' + objectType.getModelName() + ' found to update, aborting.');
            return Promise.reject();
        }
    });
};

/**
 * removes an object from database.
 *
 * @param id ID of the object to delete.
 * @return {Promise} promise that resolves if operation finished
 */
databaseService.removeObject = function (id) {
    return pouchDbService.remove(id);
};

/**
 * Registers an update listener. All registered listeners are called if an update event from the remote couchDB
 * is received.
 * @param listener a function that should be called on remote database updates
 */
databaseService.registerUpdateListener = function (listener) {
    pouchDbService.registerUpdateListener(listener);
};

/**
 * clears all update listeners
 */
databaseService.clearUpdateListeners = function () {
    pouchDbService.clearUpdateListeners();
};

function applyFiltersAndSave(objectType, data) {
    return new Promise((resolve, reject) => {
        let convertedData = filterService.convertLiveToDatabaseObjects(data);
        pouchDbService.save(objectType, convertedData).then(() => {
            log.debug('saved ' + objectType.getModelName() + ', id: ' + data.id);
            resolve();
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
}

function init() {
    _initPromise = new Promise(resolve => {
        if (urlParamService.shouldResetDatabase()) {
            pouchDbService.resetDatabase().then(() => {
                initInternal();
            });
        } else {
            initInternal();
        }

        function initInternal() {
            pouchDbService.query(MetaData).then(metadataObjects => {
                let promises = [];
                if(!metadataObjects) {
                    let metadata = new MetaData();
                    encryptionService.setEncryptionSalt(metadata.id);
                    promises.push(applyFiltersAndSave(MetaData, metadata));
                } else {
                    let metadata = metadataObjects instanceof Array ? metadataObjects[0] : metadataObjects;
                    encryptionService.setEncryptionSalt(metadata.id);
                }
                Promise.all(promises).then(() => {
                    pouchDbService.query(GridData).then(grids => {
                        if (grids) {
                            log.debug('detected saved grid, no generation of new grid.');
                            return resolve();
                        } else {
                            $.get(_defaultGridSetPath, function (data) {
                                log.info('importing default grid set...');
                                let gridsData = JSON.parse(data);
                                let promises = [];
                                gridsData.forEach(gridData => {
                                    gridData._id = gridData.id;
                                    gridData._rev = null;
                                    promises.push(applyFiltersAndSave(GridData, gridData));
                                });
                                Promise.all(promises).then(() => {
                                    log.debug('imported default grid set!');
                                    resolve();
                                });
                            });
                        }
                    });
                });
            });
        }
    });
}

//auto-init module
init();

export {databaseService};