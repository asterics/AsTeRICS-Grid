import $ from 'jquery';
import LZString from 'lz-string';

import {GridData} from "../../model/GridData.js";
import {urlParamService} from "../urlParamService";
import {MetaData} from "../../model/MetaData";
import {encryptionService} from "./encryptionService";
import {pouchDbService} from "./pouchDbService";
import {filterService} from "./filterService";
import {modelUtil} from "../../util/modelUtil";
import {i18nService} from "../i18nService";
import {Dictionary} from "../../model/Dictionary";

let databaseService = {};

let _initPromise = null;
let _defaultGridSetPath = 'app/examples/default.grd';
if (urlParamService.getDefaultGridsetName()) {
    _defaultGridSetPath = 'app/examples/' + urlParamService.getDefaultGridsetName();
}
let _defaultDictPath = i18nService.isBrowserLangDE() ? 'app/dictionaries/default_de.txt' : 'app/dictionaries/default_en.txt';
let _defaultDictName = i18nService.isBrowserLangDE() ? 'WoerterbuchDeutsch ' : 'EnglishDictionary';

/**
 * queries for objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. GridData, given as real object, not as string
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
 * same as databaseService.getObject(), but the result is returned as single object or null, if no object was found.
 * @param objectType
 * @param id
 * @param onlyShortVersion
 */
databaseService.getSingleObject = function (objectType, id, onlyShortVersion) {
    return databaseService.getObject(objectType, id, onlyShortVersion).then(result => {
        return Promise.resolve(result instanceof Array ? result[0] : result);
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
 * Inits/sets up for using of the database that belongs to the given username.
 * If the database of the given user is already opened and synchronization state is as intended, nothing is done.
 *
 * @param username the username of the logged in user
 * @param hashedUserPassword hashed password of the user
 * @param userDatabaseURL the database-URL of the logged in user
 * @param onlyRemote if true only the remote database is used, no local database is created (one-time login)
 *
 * @return {*}
 */
databaseService.initForUser = function (username, hashedUserPassword, userDatabaseURL, onlyRemote) {
    let shouldSync = userDatabaseURL && !onlyRemote || false;
    if (pouchDbService.getOpenedDatabaseName() === username && shouldSync === pouchDbService.isSyncEnabled()) {
        return Promise.resolve();
    }
    return pouchDbService.initDatabase(username, userDatabaseURL, onlyRemote).then(() => {
        return initInternal(hashedUserPassword);
    });
};

/**
 * Inits/sets up for using of the database that belongs to the given username that was just created.
 * If the database of the given user is already opened and synchronization state is as intended, nothing is done.
 *
 * @param username the username of the just registered user
 * @param hashedUserPassword hashed password of the user
 * @param userDatabaseURL the database-URL of the logged in user
 * @param onlyRemote if true only the remote database is used, no local database is created (one-time login)
 *
 * @return {*}
 */
databaseService.registerForUser = function (username, hashedUserPassword, userDatabaseURL, onlyRemote) {
    let shouldSync = userDatabaseURL && !onlyRemote;
    if (pouchDbService.getOpenedDatabaseName() === username && shouldSync === pouchDbService.isSyncEnabled()) {
        return Promise.resolve();
    }
    return pouchDbService.createDatabase(username, userDatabaseURL, onlyRemote).then(() => {
        return initInternal(hashedUserPassword);
    });
};

/**
 * deletes the local database belonging to the given username
 * @param user the name of the user whose database should be deleted
 * @return {*}
 */
databaseService.deleteDatabase = function (user) {
    if (!user) {
        return;
    }
    return pouchDbService.deleteDatabase(user);
};

/**
 * closes the currently opened database(s), afterwards new initialization of pouchDbService using initForUser() or
 * registerForUser() is necessary.
 * @return {*}
 */
databaseService.closeCurrentDatabase = function () {
    return pouchDbService.closeCurrentDatabase();
};

/**
 * returns the name of the currently opened database
 * @return {*}
 */
databaseService.getCurrentUsedDatabase = function () {
    return pouchDbService.getOpenedDatabaseName();
};

function initInternal(hashedUserPassword) {
    let skipCheckGenerateDefaultGrid = !pouchDbService.isUsingLocalDb(); //no checking/generation of default grid for remote databases
    let metadata = null;
    let saveMetadata = false;

    _initPromise = Promise.resolve().then(() => { //reset DB if specified by URL
        let promises = [];
        if (urlParamService.shouldResetDatabase()) {
            promises.push(pouchDbService.resetDatabase());
        }
        return Promise.all(promises);
    }).then(() => {
        return pouchDbService.query(MetaData.getModelName());
    }).then(metadataObjects => { //create metadata object if not exisiting, update datamodel version, if outdated
        let promises = [];
        if (!metadataObjects || metadataObjects.length === 0) {
            saveMetadata = true;
            metadata = new MetaData();
            encryptionService.setEncryptionProperties(hashedUserPassword, metadata.id);
        } else {
            metadata = metadataObjects instanceof Array ? metadataObjects[0] : metadataObjects;
            encryptionService.setEncryptionProperties(hashedUserPassword, metadata.id);
            if (metadataObjects.length && metadataObjects.length > 1) {
                promises.push(fixDuplicatedMetadata(hashedUserPassword, metadataObjects))
            }
        }
        return Promise.all(promises);
    }).then(() => {
        if (skipCheckGenerateDefaultGrid) {
            return Promise.resolve();
        }
        return pouchDbService.query(GridData.getModelName());
    }).then(grids => { //import default gridset, if no grids are existing
        if (skipCheckGenerateDefaultGrid) {
            return Promise.resolve();
        }
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
        return i18nService.translateGrids(JSON.parse(data));
    }).then(gridsData => {
        if (!gridsData || skipCheckGenerateDefaultGrid) {
            return Promise.resolve();
        }
        log.info('importing default grid set ' + _defaultGridSetPath);
        let promises = [];
        gridsData = GridData.regenerateIDs(gridsData);
        if (!metadata.lastOpenedGridId && gridsData[0] && gridsData[0].id) {
            metadata.lastOpenedGridId = gridsData[0].id;
        }
        gridsData.forEach(gridData => {
            gridData.gridElements = GridData.sortGridElements(gridData.gridElements);
            promises.push(applyFiltersAndSave(GridData.getModelName(), gridData));
        });
        log.debug('imported default grid set!');
        return Promise.all(promises);
    }).then(() => {
        if (saveMetadata) {
            return applyFiltersAndSave(MetaData.getModelName(), metadata);
        } else {
            return Promise.resolve();
        }
    }).then(() => {
        return importDefaultDictionary();
    });
    return _initPromise;
}

function importDefaultDictionary() {
    return pouchDbService.query(Dictionary.getModelName()).then(result => {
        if (result) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            log.info('importing dictionary: ' + _defaultDictPath);
            $.get(_defaultDictPath).success(result => {
                log.debug('success getting default dictionary.');
                resolve(LZString.decompressFromBase64(result));
            }).fail((e) => {
                log.debug('error getting default dictionary.');
                resolve();
            });
        });
    }).then(importData => {
        if (!importData) {
            return Promise.resolve();
        }
        let dict = new Dictionary({
            dictionaryKey: _defaultDictName,
            data: importData
        });
        return applyFiltersAndSave(Dictionary.getModelName(), dict);
    });
}

function applyFiltersAndSave(modelName, data) {
    return new Promise((resolve, reject) => {
        let convertedData = filterService.convertLiveToDatabaseObjects(data);
        pouchDbService.save(modelName, convertedData).then(() => {
            log.debug('saved ' + modelName + ', id: ' + data.id);
            resolve();
        }).catch(function (err) {
            reject(err);
        });
    });
}

function fixDuplicatedMetadata(hashedUserPassword, metadataObjects) {
    log.warn('fixing duplicated metadata...');
    let metadataIds = null;
    return pouchDbService.all().then(encryptedDocs => {
        let decryptedDocs = [];
        metadataIds = metadataObjects.map(e => e.id);
        let promises = [];
        encryptedDocs.forEach(doc => {
            decryptedDocs.push(tryToDecrypt(doc, metadataIds));
        });
        let keepMetadataId = metadataIds.pop();
        encryptionService.setEncryptionProperties(hashedUserPassword, keepMetadataId);
        log.warn('keeiping metadata: ' + keepMetadataId);
        log.warn('decrypted docs:');
        log.warn(decryptedDocs);
        log.warn('re-encrypting and saving them...');
        decryptedDocs.forEach(doc => {
            let promise = applyFiltersAndSave(doc.modelName, doc);
            promises.push(promise);
        });
        return Promise.all(promises);
    }).then(() => {
        let promises = [];
        log.warn('deleting superfluous metadata objects ...');
        metadataIds.forEach(id => {
            promises.push(pouchDbService.remove(id));
        });
        return Promise.all(promises);
    }).then(() => {
        log.warn('all done - reloading page...');
        window.location.reload();
        return Promise.reject();
    });

    function tryToDecrypt(object, metadataIds) {
        let remainingIds = JSON.parse(JSON.stringify(metadataIds));
        try {
            return encryptionService.decryptObjects(object)
        } catch (e) {
            if (remainingIds.length === 0) {
                throw "something really went wrong - unable to decrypt object: " + object.modelName + ', id: ' + object.id;
            }
            encryptionService.setEncryptionProperties(hashedUserPassword, remainingIds.pop());
            return tryToDecrypt(object, remainingIds);
        }
    }
}

export {databaseService};