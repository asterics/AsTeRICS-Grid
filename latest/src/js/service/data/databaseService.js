import $ from '../../externals/jquery.js';

import { urlParamService } from '../urlParamService';
import { MetaData } from '../../model/MetaData';
import { encryptionService } from './encryptionService';
import { pouchDbService } from './pouchDbService';
import { convertServiceDb } from './convertServiceDb';
import { localStorageService } from './localStorageService';
import { util } from '../../util/util';
import { constants } from '../../util/constants';

let databaseService = {};

let _initPromise = null;
let _lastDataModelVersion = null;

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
    if (!_initPromise) {
        return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
        _initPromise.then(() => {
            if (!objectType.getIdPrefix) {
                log.warn('missing method getIdPrefix() in allObjects()');
                return reject();
            }
            pouchDbService
                .all(objectType.getIdPrefix(), id)
                .then((result) => {
                    let options = {
                        objectType: objectType,
                        onlyShortVersion: onlyShortVersion
                    };
                    let filteredData = convertServiceDb.convertDatabaseToLiveObjects(result, options);
                    let modelVersion = getModelVersion(filteredData);
                    if (modelVersion && _lastDataModelVersion !== modelVersion) {
                        _lastDataModelVersion = modelVersion;
                        localStorageService.setUserModelVersion(pouchDbService.getOpenedDatabaseName(), modelVersion);
                    }
                    resolve(filteredData);
                })
                .catch((reason) => {
                    reject(reason);
                });
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
    return databaseService.getObject(objectType, id, onlyShortVersion).then((result) => {
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
    return _initPromise
        .then(() => {
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
        })
        .then((existingObject) => {
            if (existingObject) {
                log.debug(objectType.getModelName() + ' already existing, doing update. id: ' + existingObject.id);
                let newObject = new objectType(data, existingObject);
                let saveData = JSON.parse(JSON.stringify(newObject));
                saveData._id = existingObject._id;
                saveData._rev = existingObject._rev;
                return applyFiltersAndSave(objectType.getIdPrefix(), saveData);
            } else if (!onlyUpdate) {
                let saveData = JSON.parse(JSON.stringify(data));
                saveData._id = saveData.id;
                return applyFiltersAndSave(objectType.getIdPrefix(), saveData);
            } else {
                log.warn('no existing ' + objectType.getModelName() + ' found to update, aborting.');
                return Promise.reject();
            }
        });
};

/**
 * saves a list of objects/documents in one action
 * @param objectList
 * @return {Promise<unknown[]>}
 */
databaseService.bulkSave = function (objectList) {
    if (!objectList || objectList.length === 0) {
        return Promise.resolve();
    }
    if (objectList[0].isShortVersion) {
        log.warn('not saving short version!');
        return Promise.resolve();
    }
    let elementCount = objectList.reduce((total, grid) => {
        let gridElementCount = grid.gridElements ? grid.gridElements.length : 0;
        return total + gridElementCount;
    }, 0);
    let maxCountSaveAtOnce = 1000; //found out by tests, above pouchdb errors occured
    let elemsPerGrid = Math.floor(elementCount / objectList.length);
    let encryptedList = convertServiceDb.convertLiveToDatabaseObjects(objectList);
    let chunks = [];
    encryptedList.forEach((object) => {
        object._id = object.id;
    });
    if (elementCount > maxCountSaveAtOnce) {
        let gridsPerChunk = Math.floor(maxCountSaveAtOnce / elemsPerGrid);
        chunks = util.splitInChunks(encryptedList, gridsPerChunk);
    } else {
        chunks = [objectList];
    }
    function saveChunksSequentially(chunks) {
        let chunk = JSON.parse(JSON.stringify(chunks.shift()));
        return pouchDbService.bulkDocs(chunk).then(() => {
            if (chunks.length > 0) {
                return saveChunksSequentially(chunks);
            } else {
                return Promise.resolve();
            }
        });
    }
    return saveChunksSequentially(chunks);
};

/**
 * deletes a list of objects/documents in one action
 * @param objectList
 * @return {Promise<never>}
 */
databaseService.bulkDelete = function (objectList) {
    if (!objectList || objectList.length === 0) {
        return Promise.resolve();
    }
    let deletedObjects = objectList.map(e => ({
        _id: e.id,
        _rev: e._rev,
        _deleted: true
    }));
    return pouchDbService.bulkDocs(deletedObjects);
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
    let shouldSync = (userDatabaseURL && !onlyRemote) || false;
    let userAlreadyOpened = pouchDbService.getOpenedDatabaseName() === username;
    let isLocalUser = localStorageService.getSavedLocalUsers().indexOf(username) !== -1;
    if (userAlreadyOpened && shouldSync === pouchDbService.isSyncEnabled()) {
        return Promise.resolve();
    }
    $(document).trigger(constants.EVENT_USER_CHANGING);
    return pouchDbService.initDatabase(username, userDatabaseURL, onlyRemote).then(() => {
        if (userAlreadyOpened) {
            return Promise.resolve();
        } else {
            return initInternal(hashedUserPassword, username, isLocalUser);
        }
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
    let isLocalUser = localStorageService.getSavedLocalUsers().indexOf(username) !== -1;
    if (pouchDbService.getOpenedDatabaseName() === username && shouldSync === pouchDbService.isSyncEnabled()) {
        return Promise.resolve();
    }
    return pouchDbService.createDatabase(username, userDatabaseURL, onlyRemote).then(() => {
        return initInternal(hashedUserPassword, username, isLocalUser);
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

function initInternal(hashedUserPassword, username, isLocalUser) {
    _initPromise = Promise.resolve()
        .then(() => {
            //reset DB if specified by URL
            let promises = [];
            if (urlParamService.shouldResetDatabase()) {
                promises.push(pouchDbService.resetDatabase(username));
            }
            return Promise.all(promises);
        })
        .then(() => {
            return pouchDbService.allArray(MetaData.getIdPrefix());
        })
        .then((metadataObjects) => {
            //create metadata object if not exisiting, update datamodel version, if outdated
            let promises = [];
            if (metadataObjects.length === 0) {
                let metadata = new MetaData();
                metadataObjects = [metadata];
                encryptionService.setEncryptionProperties(hashedUserPassword, metadata.id, isLocalUser);
                promises.push(applyFiltersAndSave(MetaData.getIdPrefix(), metadata));
            }
            metadataObjects.sort((a, b) => a.id.localeCompare(b.id)); // always prefer older metadata objects
            let metadataIds = metadataObjects.map((o) => o.id);
            encryptionService.setEncryptionProperties(hashedUserPassword, metadataIds, isLocalUser);

            if (metadataObjects.length && metadataObjects.length > 1) {
                log.warn('found duplicated metadata!');
            }
            return Promise.all(promises);
        });
    _initPromise.then(() => {
        _lastDataModelVersion = null;
        $(document).trigger(constants.EVENT_USER_CHANGED);
    });
    return _initPromise;
}

function applyFiltersAndSave(idPrefix, data) {
    return new Promise((resolve, reject) => {
        let convertedData = convertServiceDb.convertLiveToDatabaseObjects(data);
        pouchDbService
            .save(idPrefix, convertedData)
            .then(() => {
                log.debug('saved ' + idPrefix + ', id: ' + data.id);
                resolve();
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function getModelVersion(dataOrArray) {
    if (!dataOrArray) {
        return null;
    }
    if (dataOrArray.modelVersion) {
        return dataOrArray.modelVersion;
    }
    if (dataOrArray[0] && dataOrArray[0].modelVersion) {
        return dataOrArray[0].modelVersion;
    }
    return null;
}

export { databaseService };
