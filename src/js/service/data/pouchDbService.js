import $ from 'jquery';
import PouchDB from 'PouchDB';
import {localStorageService} from "./localStorageService";
import {constants} from "../../util/constants";
import {filterService} from "./filterService";

let pouchDbService = {};

let _dbName = null;
let _db = null;
let _remoteDb = null;
let _syncHandler = null;
let _useLocalDb = true;
let _syncState = constants.DB_SYNC_STATE_FAIL;
let _resumeSyncTimeoutHandler = null;
let _lastQueryTime = 1000;
let _onlyRemote = false;
let _justCreated = false;
let _databaseJustCreated = false;
let _cachedDocuments = {};

/**
 * inits the pouchdb to use to a user-database, e.g. with the same name as the username
 * if a local database named as the given username does not exist, a new local database is created
 *
 * @param databaseName the database name to use, e.g. use username
 * @param remoteCouchDbAddress optional parameter, if defined an address of a remote couchdb endpoint where the
 *        local database should be synced
 * @param onlyRemote if true only the remote database is used and no local database is created
 * @return {*} a promise that is resolved at a time when pouchDbService can be used for retrieving/saving data to a
 *             database named like the given username
 */
pouchDbService.initDatabase = function (databaseName, remoteCouchDbAddress, onlyRemote) {
    return initPouchDbServiceInternal(databaseName, remoteCouchDbAddress, onlyRemote, false);
};

/**
 * see pouchDbService.initDatabase(), only difference: calling this method indicates that the user
 * just registered and therefore the databases are just being created and synchronization strategy can be different,
 * see documentation of local method setupSync().
 * @param databaseName
 * @param remoteCouchDbAddress
 * @param onlyRemote
 */
pouchDbService.createDatabase = function (databaseName, remoteCouchDbAddress, onlyRemote) {
    return initPouchDbServiceInternal(databaseName, remoteCouchDbAddress, onlyRemote, true);
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
    if (id && _cachedDocuments[id]) {
        log.debug('using cache for retrieving id: ' + id);
        return Promise.resolve(_cachedDocuments[id]);
    }
    let dbToUse = getDbToUse();
    let queryStartTime = new Date().getTime();
    if (!_useLocalDb) {
        cancelSync();
    }
    let returnPromise = queryInternal(modelName, id, dbToUse);
    returnPromise.then(result => {
        if (id) {
            _cachedDocuments[id] = result;
        }
    });
    returnPromise.finally(() => {
        _lastQueryTime = new Date().getTime() - queryStartTime;
        log.trace('last query time: ', _lastQueryTime);
        resumeSync();
    });
    return returnPromise;
};

/**
 * returns (resolves) all documents that are stored in pouchDb.
 * @return {Promise}
 */
pouchDbService.all = function () {
    let dbToUse = getDbToUse();
    if (!_useLocalDb) {
        cancelSync();
    }
    return new Promise((resolve, reject) => {
        dbToUse.allDocs({
            include_docs: true,
            attachments: false
        }).then(function (res) {
            resolve(dbResToResolveObject(res));
        }).catch(function (err) {
            log.error(err);
            reject();
        }).finally(() => {
            resumeSync();
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
    if (!_useLocalDb) {
        cancelSync();
    }
    if (data.id) {
        _cachedDocuments[data.id] = data;
    }
    return new Promise((resolve, reject) => {
        if (!data || !data._id || !modelName || !data.encryptedDataBase64) {
            log.error('did not specify needed parameter "modelName" or "_id" or data is not encrypted! aborting.');
            return reject();
        }
        dbToUse.put(data).then(() => {
            log.debug('updated ' + modelName + ', id: ' + data._id);
            resolve();
        }).catch(function (err) {
            if (data.id) {
                delete _cachedDocuments[data.id];
            }
            log.error(err);
            reject();
        }).finally(() => {
            resumeSync();
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
    let returnPromise = queryInternal(null, id, dbToUse).then(object => {
        delete _cachedDocuments[id];
        log.debug('deleted object from db! id: ' + object.id);
        return dbToUse.remove(object);
    });
    returnPromise.finally(() => {
        resumeSync();
    });
    return returnPromise;
};

/**
 * dumps the whole database to a String
 * @return {Promise} promise that resolves to a String containing the dumped database
 */
pouchDbService.dumpDatabase = function () {
    if (!_useLocalDb) {
        return Promise.reject();
    }
    _cachedDocuments = {};
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
    _cachedDocuments = {};
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
    _cachedDocuments = {};
    return new Promise(resolve => {
        _db.destroy().then(function () {
            _db = null;
            pouchDbService.initDatabase(localStorageService.getLastActiveUser()).then(() => resolve());
        }).catch(function (err) {
            log.error('error destroying database: ' + err);
        })
    });
};

/**
 * deletes the specified local database
 * @param databaseName the name of the database to delete
 * @return {*}
 */
pouchDbService.deleteDatabase = function (databaseName) {
    if (!_useLocalDb || !databaseName) {
        log.warn("won't delete database since using remote db or databaseName not specified...");
        return Promise.reject();
    }
    _cachedDocuments = {};
    let promises = [];
    if (_dbName === databaseName) {
        promises.push(closeOpenDatabases());
    }
    return Promise.all(promises).then(() => {
        let db = new PouchDB(databaseName);
        return db.destroy();
    });
};

/**
 * returns the database name of the currently opened (local) database
 * @return {*}
 */
pouchDbService.getOpenedDatabaseName = function () {
    return _dbName;
};

/**
 * returns true if pouchDbService is currently using a local database, otherwise (only remote) false
 * @return {boolean}
 */
pouchDbService.isUsingLocalDb = function () {
    return _useLocalDb;
};

/**
 * returns the current synchronization state of the databases, see constants.DB_SYNC_STATE_*. If no synchronization
 * is set up constants.DB_SYNC_STATE_FAIL is returned.
 * @return {*}
 */
pouchDbService.getSyncState = function () {
    return _syncState;
};

/**
 * returns true if synchronizations is currently set up and enabled
 * @return {*}
 */
pouchDbService.isSyncEnabled = function () {
    return !!_syncHandler;
};

/**
 * cancels current synchronization activity
 * is used to temporarily pause first-time synchronization and speed up request to remote DB
 */
function cancelSync() {
    if (_resumeSyncTimeoutHandler) {
        clearTimeout(_resumeSyncTimeoutHandler);
        _resumeSyncTimeoutHandler = null;
    }
    if (_syncHandler) {
        log.debug('canceling sync ...');
        setSyncState(constants.DB_SYNC_STATE_STOPPED);
        _syncHandler.cancel();
        _syncHandler = null;
    }
}

/**
 * Resumes sync after a timeout. The timeout is specified by the duration of the last query() request to the remote
 * database. Therefore for bulked requests to pouchDbService sync is paused for the time of all requests and only
 * re-started in idle state.
 * Sync is not resumed/started if global _onlyRemote parameter is set
 */
function resumeSync() {
    if (_onlyRemote) {
        return;
    }
    let timeout = _lastQueryTime + 1000;
    _resumeSyncTimeoutHandler = setTimeout(() => {
        if (!_syncHandler && _remoteDb) {
            log.debug('resuming sync...');
            setupSync();
        }
    }, timeout);
}

function getDbToUse() {
    let dbToUse = (_useLocalDb && !_onlyRemote) ? _db : _remoteDb;
    if (!dbToUse) {
        throw 'Using pouchDbService uninitialized is not possible. First initialize a database by using pouchDbService.initDatabase().'
    }
    return dbToUse;
}

function closeOpenDatabases() {
    let promises = [];
    cancelSync();
    if (_db) promises.push(_db.close());
    if (_remoteDb) promises.push(_remoteDb.close());
    resetLocalProperties();
    return Promise.all(promises);
}

function resetLocalProperties() {
    _dbName = null;
    _db = null;
    _remoteDb = null;
    _syncHandler = null;
    _useLocalDb = true;
    _syncState = constants.DB_SYNC_STATE_FAIL;
    _resumeSyncTimeoutHandler = null;
    _lastQueryTime = 1000;
    _onlyRemote = false;
    _justCreated = false;
    _databaseJustCreated = false;
    _cachedDocuments = {};
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

/**
 * inits pouchDbService
 *
 * @param databaseName the database name to use
 * @param remoteCouchDbAddress the remote database address to use (optional)
 * @param onlyRemote if true only using the remote database, not opening/creating a local one (for one-time login)
 * @param justCreated if true the user just registered, so databases are just being created and the local DB can be used
 *        without waiting for inital synchronization with remote database
 * @return {*}
 */
function initPouchDbServiceInternal(databaseName, remoteCouchDbAddress, onlyRemote, justCreated) {
    if (!databaseName) {
        return Promise.reject();
    }
    _cachedDocuments = {};
    return closeOpenDatabases().then(function () {
        if (onlyRemote) {
            setSyncState(constants.DB_SYNC_STATE_ONLINEONLY);
        }
        _dbName = databaseName;
        _databaseJustCreated = justCreated;
        _onlyRemote = onlyRemote;
        _justCreated = justCreated;
        log.debug('initializing database: ' + _dbName);

        let promises = [];
        let openLocalPromise = null;
        if (!remoteCouchDbAddress || (remoteCouchDbAddress && !onlyRemote)) {
            openLocalPromise = openDbInternal(_dbName).then((dbHandler) => {
                _db = dbHandler;
                return Promise.resolve();
            });
            promises.push(openLocalPromise);
        }

        if (remoteCouchDbAddress) {
            promises.push(openDbInternal(remoteCouchDbAddress, true).then((dbHandler) => {
                _remoteDb = dbHandler;
                if (!onlyRemote) {
                    return openLocalPromise.then(() => { //make sure local DB opened before set up sync
                        return setupSync();
                    });
                } else {
                    _remoteDb.changes({
                        since: 'now',
                        live: true,
                        include_docs: true
                    }).on('change', function (info) {
                        handleDbChange(info);
                    });
                    return Promise.resolve();
                }
            }));
        }

        return Promise.all(promises);
    });
}

/**
 * opens a PouchDB instance by given name/address, creates needed index and resolves with opened database handler
 * @param dbNameOrAddress
 * @return {*}
 */
function openDbInternal(dbNameOrAddress, isOnlineDb) {
    let dbHandler = new PouchDB(dbNameOrAddress);
    return dbHandler.info().then(function (info) {
        log.debug(dbNameOrAddress + ' info:');
        log.debug(info);
        if (isOnlineDb) {
            return Promise.resolve();
        } else {
            log.debug('creating index for db: ' + dbNameOrAddress);
            return dbHandler.createIndex({
                index: {fields: ['modelName', 'id']}
            });
        }
    }).then(() => {
        return Promise.resolve(dbHandler);
    });
}

/**
 * sets up synchronization of local DB and remote DB
 *
 * The following scenarios are possible:
 * 1) sync was never (fully) completed before -> initial full sync is started and as long it is not completed
 * pouchDBService uses the remote DB for all database interactions. After completion of initial sync, pouchdBService
 * switches to using the local DB and live-sync is set up.
 * 2) sync was never fully completed before, but the user was just registered and the databases are just created ->
 * directly use local DB and setup live-sync.
 * 3) sync was already fully completed at some time -> directly use local DB and setup live sync
 *
 * @return {Promise<any>}
 */
function setupSync() {
    if (!_remoteDb || !_db) {
        log.error('trying to setupSync() but remoteDb or db is not specified! Aborting...');
        return Promise.reject();
    }
    return new Promise(resolve => {
        //first completely update DB
        let starttime = new Date().getTime();
        let wasAlreadySynced = localStorageService.isDatabaseSynced(_dbName);
        if (!wasAlreadySynced && !_justCreated) {
            //first-time full sync will maybe take longer, so use remote DB meanwhile
            log.debug("database wasn't synced before, so temporarily use remote db until sync is done...");
            _useLocalDb = false;
            _syncHandler = _db.sync(_remoteDb, {
                live: false,
                retry: false,
                batch_size: 1
            }).on('active', function (info) {
                setSyncState(constants.DB_SYNC_STATE_SYNCINC);
            }).on('paused', function () {
                setSyncState(constants.DB_SYNC_STATE_SYNCED);
            }).on('error', function (err) {
                log.info('couchdb error');
                log.error(err);
            }).on('complete', function (info) {
                log.debug('sync complete event');
                log.debug(info);
                let status = info && info.pull ? info.pull.status : (info && info.push ? info.push.status : null);
                if (status === 'cancelled') {
                    log.debug('sync cancelled!');
                } else if (status === 'complete') {
                    log.info('couchdb sync complete! setting up live sync and using local db now...');
                    log.debug('initial sync took: ' + (new Date().getTime() - starttime) + "ms");
                    _useLocalDb = true;
                    setupLiveSync();
                }
            });
            resolve();
        } else {
            //if local DB was already synced, we can immediately use it and don't have to wait for possibly upcoming updates
            setupLiveSync();
            resolve();
        }

        //setup live sync
        function setupLiveSync() {
            localStorageService.markSyncedDatabase(_dbName);
            _syncHandler = _db.sync(_remoteDb, {
                live: true,
                retry: false
            }).on('paused', function (info) {
                log.debug('sync paused');
                log.debug(info);
                setSyncState(constants.DB_SYNC_STATE_SYNCED);
            }).on('active', function (info) {
                log.debug('sync active');
                log.debug(info);
                setSyncState(constants.DB_SYNC_STATE_SYNCINC);
            }).on('change', function (info) {
                handleDbChange(info);
            }).on('error', function (err) {
                log.info('couchdb error');
                log.info(err);
                triggerConnectionLost();
            });
        }
    });
}

/**
 * sets internal synchronization state, emits corresponding EVENT_DB_SYNC_STATE_CHANGE event if state changed
 * @param syncState the current sync state, see constants.DB_SYNC_STATE_*
 */
function setSyncState(syncState) {
    try {
        if (_syncState !== syncState) {
            _syncState = syncState;
            $(document).trigger(constants.EVENT_DB_SYNC_STATE_CHANGE, syncState);
        }
    } catch (e) {
        log.error(e);
    }
}

function triggerConnectionLost() {
    cancelSync();
    $(document).trigger(constants.EVENT_DB_CONNECTION_LOST);
    setSyncState(constants.DB_SYNC_STATE_FAIL);
}

function handleDbChange(info) {
    //in try-catch because if any event-handler throws an error this will
    //trigger the pouchDb error-handler which is not desired
    try {
        log.debug(info);
        let changedIds = [];
        let changedDocs = [];
        if (info.direction && info.direction === 'pull') {
            if (info.change && info.change.docs && info.change.docs.length > 0) {
                changedDocs = info.change.docs.filter(doc => !!doc.id);
                changedIds = changedDocs.map(doc => doc.id);
            }
            log.info('pouchdb pulling updates...');
        } else if (info.direction) {
            log.info('pouchdb pushing updates...');
        } else if (!info.direction && info.id) {
            log.info('change from remote database...');
            changedIds.push(info.id);
            if (info.doc) {
                changedDocs.push(info.doc);
            }
        }
        if (changedIds.length > 0) {
            changedDocs.forEach(doc => {
                _cachedDocuments[doc.id] = doc;
            });
            changedDocs = changedDocs.map(rawDoc => filterService.convertDatabaseToLiveObjects(rawDoc));
            $(document).trigger(constants.EVENT_DB_PULL_UPDATED, [changedIds, changedDocs]);
        }
    } catch (e) {
        log.error(e);
    }
}

/**
 * converts a native result object of pouchDB queries to a list of documents or single document used in the app
 * @param res
 * @return {*}
 */
function dbResToResolveObject(res) {
    let objects = [];
    if (res.docs && res.docs.length > 0) { //convert result of .query()
        res.docs.forEach(doc => {
            objects.push(doc);
        });
    } else if (res.rows && res.rows.length > 0) { //convert result of .allDocs()
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