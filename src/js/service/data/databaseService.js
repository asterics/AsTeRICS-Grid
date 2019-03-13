import $ from 'jquery';

import {GridData} from "../../model/GridData.js";
import {urlParamService} from "../urlParamService";
import {MetaData} from "../../model/MetaData";
import {encryptionService} from "./encryptionService";
import {pouchDbService} from "./pouchDbService";
import {filterService} from "./filterService";
import {modelUtil} from "../../util/modelUtil";
import {loginService} from "../loginService";

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
            pouchDbService.query(objectType.getModelName(), id).then(result => {
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
            return applyFiltersAndSave(objectType.getModelName(), saveData);
        } else if (!onlyUpdate) {
            let saveData = JSON.parse(JSON.stringify(data));
            saveData._id = saveData.id;
            return applyFiltersAndSave(objectType.getModelName(), saveData);
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

/**
 * updates the current user according to information provided by loginService.
 * changes currently used database to the currently logged in user's database.
 *
 * @return {*}
 */
databaseService.updateUser = function () {
    return pouchDbService.setUser(loginService.getLoggedInUsername(), loginService.getLoggedInUserDatabase()).then(() => {
        return initInternal();
    });
};

function initInternal() {
    databaseService.clearUpdateListeners();
    _initPromise = Promise.resolve().then(() => { //reset DB if specified by URL
        let promises = [];
        if (urlParamService.shouldResetDatabase()) {
            promises.push(pouchDbService.resetDatabase());
        }
        return Promise.all(promises);
    }).then(() => {
        return pouchDbService.queryLocalAndRemote(MetaData.getModelName());
    }).then(metadataObjects => { //create metadata object if not exisiting, update datamodel version, if outdated
        let promises = [];
        if (!metadataObjects || metadataObjects.length === 0) {
            let metadata = new MetaData();
            encryptionService.setEncryptionSalt(metadata.id);
            promises.push(applyFiltersAndSave(MetaData.getModelName(), metadata));
        } else {
            let metadata = metadataObjects instanceof Array ? metadataObjects[0] : metadataObjects;
            encryptionService.setEncryptionSalt(metadata.id);
            if (!modelUtil.isLatestMajorModelVersion(metadata)) {
                log.warn('updating data model version...');
                promises.push(updateDataModelVersion(metadata));
            }
        }
        return Promise.all(promises);
    }).then(() => {
        return pouchDbService.query(GridData.getModelName());
    }).then(grids => { //import default gridset, if no grids are existing
        if (grids) {
            log.debug('detected saved grid, no generation of new grid.');
            return Promise.resolve();
        } else {
            return $.get(_defaultGridSetPath);
        }
    }).then(data => {
        if (!data) {
            return Promise.resolve();
        }
        log.info('importing default grid set...');
        let promises = [];
        let gridsData = JSON.parse(data);
        gridsData.forEach(gridData => {
            gridData._id = gridData.id;
            gridData._rev = null;
            promises.push(applyFiltersAndSave(GridData.getModelName(), gridData));
        });
        log.debug('imported default grid set!');
        return Promise.all(promises);
    });
    return _initPromise;
};

function applyFiltersAndSave(modelName, data) {
    return new Promise((resolve, reject) => {
        let convertedData = filterService.convertLiveToDatabaseObjects(data);
        pouchDbService.save(modelName, convertedData).then(() => {
            log.debug('saved ' + modelName + ', id: ' + data.id);
            resolve();
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
}

function updateDataModelVersion(metadata) {
    let allDocs = null;
    return pouchDbService.all().then(result => {
        allDocs = result;
        if (!metadata.encryptedDataBase64) {
            log.debug('deleting all documents because they are not encrypted...');
            allDocs.forEach(doc => {
                delete doc._rev;
            });
            return pouchDbService.resetDatabase();
        }
        return Promise.resolve();
    }).then(() => {
        log.debug('all deleted, got: ');
        log.debug(allDocs);
        let promises = [];
        allDocs.forEach(doc => {
            let promise = applyFiltersAndSave(doc.modelName, doc);
            promises.push(promise);
        });
        return Promise.all(promises);
    }).then(() => {
        window.location.reload();
        return Promise.reject();
    });
}

export {databaseService};