import $ from 'jquery';
import PouchDB from 'PouchDB';
import {localStorageService} from "./localStorageService";
import {constants} from "../../util/constants";

let pouchDbService = {};

let _dbName = null;
let _db = null;
let _remoteDb = null;
let _syncHandler = null;
let _useLocalDb = true;
let _inSync = false;

/**
 * inits the pouchdb to use to a user-database, e.g. with the same name as the username
 * if a local database named as the given username does not exist, a new local database is created
 *
 * @param databaseName the database name to use, e.g. use username
 * @param remoteCouchDbAddress optional parameter, if defined an address of a remote couchdb endpoint where the
 *        local database should be synced
 * @return {*} a promise that is resolved at a time when pouchDbService can be used for retrieving/saving data to a
 *             database named like the given username
 */
pouchDbService.initDatabase = function (databaseName, remoteCouchDbAddress) {
    if (!databaseName) {
        return Promise.reject();
    }
    return closeOpenDatabases().then(function () {
        _dbName = databaseName;
        log.debug('initializing database: ' + _dbName);
        return initPouchDB(remoteCouchDbAddress);
    });
};

/**
 * queries for encrypted objects in the local database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param modelName the modelName to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @return {Promise}
 */
pouchDbService.query = function (modelName, id) {
    let dbToUse = getDbToUse();
    return queryInternal(modelName, id, dbToUse);
};

/**
 * returns (resolves) all documents that are stored in pouchDb.
 * @return {Promise}
 */
pouchDbService.all = function () {
    let dbToUse = getDbToUse();
    return new Promise((resolve, reject) => {
        dbToUse.allDocs({
            include_docs: true,
            attachments: false
        }).then(function (res) {
            resolve(dbResToResolveObject(res));
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
};

/**
 * saves an object to database that is already encrypted
 *
 * @param modelName the modelName to save, e.g. "GridData"
 * @param data the encrypted data object to save
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
pouchDbService.save = function (modelName, data) {
    log.debug('saving ' + modelName + '...');
    let dbToUse = getDbToUse();
    return new Promise((resolve, reject) => {
        if (!data || !data._id || !modelName || !data.encryptedDataBase64) {
            log.error('did not specify needed parameter "modelName" or "_id" or data is not encrypted! aborting.');
            return reject();
        }
        dbToUse.put(data).then(() => {
            log.debug('updated ' + modelName + ', id: ' + data._id);
            resolve();
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
};

/**
 * Deletes an object from database by ID.
 *
 * @param id ID of the object to delete.
 * @return {Promise} promise that resolves if operation finished
 */
pouchDbService.remove = function (id) {
    let dbToUse = getDbToUse();
    return queryInternal(null, id, dbToUse).then(object => {
        log.debug('deleted object from db! id: ' + object.id);
        return dbToUse.remove(object);
    });
};

/**
 * dumps the whole database to a String
 * @return {Promise} promise that resolves to a String containing the dumped database
 */
pouchDbService.dumpDatabase = function () {
    if (!_useLocalDb) {
        return Promise.reject();
    }
    return new Promise((resolve, reject) => {
        let dumpedString = '';
        let stream = new MemoryStream();
        stream.on('data', function (chunk) {
            dumpedString += chunk.toString();
        });

        _db.dump(stream).then(function () {
            resolve(dumpedString);
        }).catch(function (err) {
            reject();
            log.error('error on dumping database: ', err);
        });
    });
};

/**
 * imports the whole database from a file.
 * Warning: overrides the current data of the database!
 *
 * @param file a file object retrieved from a file input
 * @return {Promise} promise resolves after successful import
 */
pouchDbService.importDatabase = function (file) {
    if (!_useLocalDb) {
        return Promise.reject();
    }
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                let data = e.target.result;
                pouchDbService.resetDatabase().then(() => {
                    log.debug('resetted pouchdb! loading from string...');
                    _db.load(data).then(function () {
                        log.debug('loaded db from string!');
                        window.location.reload();
                        resolve();
                    }).catch(function (err) {
                        log.error('error loading db from string: ' + err);
                    });
                });
            };
        })(file);
        reader.readAsText(file);
    });
};

/**
 * resets the whole database, if it is the default local database, otherwise the call is rejected
 * @return {Promise} resolves after reset is finished
 */
pouchDbService.resetDatabase = function () {
    if(!_useLocalDb || _dbName !== constants.LOCAL_NOLOGIN_USERNAME) {
        return Promise.reject();
    }
    return new Promise(resolve => {
        _db.destroy().then(function () {
            _db = null;
            pouchDbService.initDatabase(localStorageService.getLastActiveUser()).then(() => resolve());
        }).catch(function (err) {
            log.error('error destroying database: ' + err);
        })
    });
};

//TODO documentation
pouchDbService.deleteDatabase = function (username) {
    if (!_useLocalDb || !username || constants.LOCAL_NOLOGIN_USERNAME) {
        return Promise.reject();
    }
    let promises = [];
    if (_dbName === username) {
        promises.push(closeOpenDatabases());
    }
    return Promise.all(promises).then(() => {
        let db = new PouchDB(username);
        return db.destroy();
    });
};

//TODO documentation
pouchDbService.getOpenedDatabaseName = function () {
    return _dbName;
};

//TODO documentation
pouchDbService.isUsingLocalDb = function () {
    return _useLocalDb;
};

//TODO documentation
pouchDbService.isSyncing = function () {
    return _inSync;
};

function getDbToUse() {
    let dbToUse = _useLocalDb ? _db : _remoteDb;
    if(!dbToUse) {
        throw 'Using pouchDbService uninitialized is not possible. First initialize a database by using pouchDbService.initDatabase().'
    }
    return dbToUse;
}

function closeOpenDatabases() {
    if (_syncHandler) {
        _syncHandler.cancel();
    }
    let promises = [];
    if (_db) promises.push(_db.close());
    if (_remoteDb) promises.push(_remoteDb.close());
    _db = null;
    _remoteDb = null;
    _dbName = null;
    return Promise.all(promises);
}

function queryInternal(modelName, id, dbToQuery) {
    if (!modelName && !id) {
        log.error('did not specify modelName or id!');
    }

    return new Promise((resolve, reject) => {
        log.debug('getting ' + modelName + '(id: ' + id + ')...');
        let query = {
            selector: {}
        };
        if (id) {
            query.selector.id = id;
        }
        if (modelName) {
            query.selector.modelName = modelName;
        }
        dbToQuery.find(query).then(function (res) {
            let objects = dbResToResolveObject(res);
            let length = objects && objects.length ? objects.length : objects ? 1 : 0;
            log.debug('found ' + modelName + ": " + length + ' elements');
            resolve(objects);
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
}

function initPouchDB(remoteCouchDbAddress) {
    let promises = [];
    _db = new PouchDB(_dbName);
    _db.info().then(function (info) {
        log.debug(info);
    });
    if (remoteCouchDbAddress) {
        promises.push(setupSync(remoteCouchDbAddress));
    }

    log.debug('creating index for db: ' + _dbName);
    promises.push(_db.createIndex({
        index: {fields: ['modelName', 'id']}
    }));
    return Promise.all(promises);
}

function setupSync(remoteCouchDbAddress) {
    return new Promise(resolve => {
        log.debug('sync pouchdb with: ' + remoteCouchDbAddress);
        _remoteDb = new PouchDB(remoteCouchDbAddress);

        //first completely update DB
        let starttime = new Date().getTime();
        let wasAlreadySynced = localStorageService.isDatabaseSynced(_dbName);
        if (!wasAlreadySynced) {
            //first-time full sync will maybe take longer, so use remote DB meanwhile
            log.info("database wasn't synced before, so temporarily use remote db until sync is done...");
            _useLocalDb = false;
            _syncHandler = _db.sync(_remoteDb, {
                live: false,
                retry: false,
                batch_size: 1
            }).on('active', function (info) {
                handleActiveForEventTriggers();
            }).on('paused', function () {
                handlePausedForEventTriggers();
            }).on('error', function (err) {
                log.info('couchdb error');
                log.error(err);
            }).on('complete', function (info) {
                log.info('couchdb sync complete! setting up live sync and using local db now...');
                log.debug('initial sync took: ' + (new Date().getTime() - starttime) + "ms");
                localStorageService.markSyncedDatabase(_dbName);
                _useLocalDb = true;
                setupLiveSync();
            });
            resolve();
        } else {
            //if local DB was already synced, we can immediately use it and don't have to wait for possibly upcoming updates
            setupLiveSync();
            resolve();
        }

        //setup live sync
        function setupLiveSync() {
            _syncHandler = _db.sync(_remoteDb, {
                live: true,
                retry: false
            }).on('paused', function (info) {
                log.debug('sync paused');
                log.debug(info);
                handlePausedForEventTriggers();
            }).on('active', function (info) {
                log.debug('sync active');
                log.debug(info);
                handleActiveForEventTriggers();
            }).on('change', function (info) {
                //in try-catch because if any event-handler throws an error this will
                //trigger the pouchDb error-handler which is not desired
                try {
                    log.debug(info);
                    if (info.direction === 'pull') {
                        let changedIds = [];
                        if (info.change && info.change.docs && info.change.docs.length > 0) {
                            changedIds = info.change.docs.map(doc => doc.id);
                            changedIds = changedIds.filter(id => !!id);
                        }
                        log.info('pouchdb pulling updates...');
                        $(document).trigger(constants.EVENT_DB_PULL_UPDATED, [changedIds]);
                    } else {
                        log.info('pouchdb pushing updates...');
                    }
                } catch (e) {
                    log.error(e);
                }
            }).on('error', function (err) {
                log.info('couchdb error');
                log.info(err);
                $(document).trigger(constants.EVENT_DB_CONNECTION_LOST);
            });
        }
    });
}

function handleActiveForEventTriggers() {
    try {
        if (!_inSync) {
            _inSync = true;
            $(document).trigger(constants.EVENT_DB_SYNC_STATE_CHANGE, _inSync);
        }
    } catch (e) {
        log.error(e);
    }
}

function handlePausedForEventTriggers() {
    try {
        if (_inSync) {
            _inSync = false;
            $(document).trigger(constants.EVENT_DB_SYNC_STATE_CHANGE, _inSync);
        }
    } catch (e) {
        log.error(e);
    }
}

function dbResToResolveObject(res) {
    let objects = [];
    if (res.docs && res.docs.length > 0) {
        res.docs.forEach(doc => {
            objects.push(doc);
        });
    } else if (res.rows && res.rows.length > 0) {
        res.rows.forEach(row => {
            if (row.doc && row.doc.modelName) {
                objects.push(row.doc);
            }
        });
    }
    if (objects.length === 0) {
        return null;
    } else if (objects.length === 1) {
        return objects[0];
    } else {
        return objects;
    }
}

export {pouchDbService};