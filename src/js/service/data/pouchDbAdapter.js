import $ from 'jquery';
import PouchDB from 'PouchDB';
import {localStorageService} from "./localStorageService";
import {encryptionService} from "./encryptionService";
import {constants} from "../../util/constants";

/**
 * PouchDbAdapter -> class responsible for opening pouchDb databases, managing synchronization and update events
 *
 * @param databaseName the database name to use
 * @param remoteCouchDbAddress the remote database address to use (optional)
 * @param onlyRemote if true only using the remote database, not opening/creating a local one (for one-time login)
 * @param justCreated if true the user just registered, so databases are just being created and the local DB can be used
 *        without waiting for inital synchronization with remote database
 * @param changeHandler method called on changes from remote database, called with parameters <changedDocIds, changedDocsEncrypted>
 * @return {*}
 */
function PouchDbAdapter(databaseName, remoteCouchDbAddress, onlyRemote, justCreated, changeHandler) {
    let thiz = this;
    let _db = null;
    let _remoteDb = null;
    let _syncHandler = null;
    let _useLocalDb = true;
    let _syncState = constants.DB_SYNC_STATE_FAIL;
    let _closed = false;
    let _openLocalPromise = null;

    /**
     * inits the class, opens databases, sets up synchronization.
     * has to be called before pouchDbAdapter can be used
     * @return {*} promise that resolves if initialization is finished.
     */
    thiz.init = function () {
        if (!databaseName) {
            return Promise.reject();
        }
        setSyncState(constants.DB_SYNC_STATE_FAIL);
        if (onlyRemote) {
            setSyncState(constants.DB_SYNC_STATE_ONLINEONLY);
        }
        log.debug('initializing database: ' + databaseName);

        let promises = [];
        if (!remoteCouchDbAddress || (remoteCouchDbAddress && !onlyRemote)) {
            _openLocalPromise = openDbInternal(databaseName).then((dbHandler) => {
                _db = dbHandler;
                return Promise.resolve();
            });
            promises.push(_openLocalPromise);
        }

        if (remoteCouchDbAddress) {
            promises.push(openDbInternal(remoteCouchDbAddress, true).then((dbHandler) => {
                _remoteDb = dbHandler;
                if (!onlyRemote) {
                    return _openLocalPromise.then(() => { //make sure local DB opened before set up sync
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

        let returnPromise = Promise.all(promises);
        returnPromise.then(() => {
            $(document).trigger(constants.EVENT_DB_INITIALIZED);
        });
        return returnPromise;
    };

    /**
     * starts sync with remote couchDB database without closing the currently open local database
     *
     * @param remoteCouchDbAddress the remote couchDB address to sync with
     * @return {*}
     */
    thiz.startSync = function (remoteCouchDbAddress) {
        if (_remoteDb || !_openLocalPromise) {
            log.warn('startSync() is not possible if remote database is already open, or local database not opened');
            return;
        }
        return _openLocalPromise.then(() => {
            return openDbInternal(remoteCouchDbAddress, true)
        }).then((dbHandler) => {
            _remoteDb = dbHandler;
            return setupSync();
        });
    };

    /**
     * returns a database object that should be currently used, can be either a local or remote database
     * @return {*}
     */
    thiz.getDbToUse = function () {
        let dbToUse = (_useLocalDb && !onlyRemote) ? _db : _remoteDb;
        if (!dbToUse || _closed) {
            throw 'Using pouchDbService uninitialized is not possible. First initialize a database by using pouchDbService.initDatabase().'
        }
        return dbToUse;
    };

    /**
     * closes all databases, cancels all synchronization tasks
     * @return {Promise<any[]>}
     */
    thiz.close = function () {
        let promises = [];
        _closed = true;
        encryptionService.resetEncryptionProperties();
        thiz.cancelSync();
        if (_db) promises.push(_db.close());
        if (_remoteDb) promises.push(_remoteDb.close());
        _db = null;
        _remoteDb = null;

        let returnPromise = Promise.all(promises);
        returnPromise.then(() => {
            $(document).trigger(constants.EVENT_DB_CLOSED);
        });
        return returnPromise;
    };

    /**
     * returns the database name of the currently opened (local) database
     * @return {*}
     */
    thiz.getOpenedDatabaseName = function () {
        return databaseName;
    };

    /**
     * returns true if pouchDbAdapter is currently using a local database, otherwise false (using only remote DB)
     * @return {boolean}
     */
    thiz.isUsingLocalDb = function () {
        return _useLocalDb;
    };

    /**
     * returns the current synchronization state of the databases, see constants.DB_SYNC_STATE_*. If no synchronization
     * is set up constants.DB_SYNC_STATE_FAIL is returned.
     * @return {*}
     */
    thiz.getSyncState = function () {
        return _syncState;
    };

    /**
     * returns true if synchronizations is currently set up and enabled
     * @return {*}
     */
    thiz.isSyncEnabled = function () {
        return !!_syncHandler;
    };

    /**
     * cancels current synchronization activity
     */
    thiz.cancelSync = function () {
        if (_syncHandler) {
            log.debug('canceling sync ...');
            setSyncState(constants.DB_SYNC_STATE_STOPPED);
            _syncHandler.cancel();
            _syncHandler = null;
        }
    };

    /**
     * cancels current synchronization activity, but only if remote database is currently used.
     * is used to temporarily pause first-time synchronization and speed up request to remote DB
     */
    thiz.cancelSyncIfUsingRemoteDb = function () {
        if (thiz.isUsingLocalDb()) {
            return;
        }
        thiz.cancelSync();
    };

    /**
     * Resumes sync. Sync is not resumed/started if global onlyRemote parameter is set, sync is already running,
     * or no remote database is open.
     */
    thiz.resumeSync = function () {
        if (onlyRemote || _syncHandler || !_remoteDb) {
            return;
        }
        log.debug('resuming sync...');
        return setupSync();
    };

    /**
     * opens a PouchDB instance by given name/address, creates needed index and resolves with opened database handler
     * @param dbNameOrAddress
     * @param isOnlineDb set to true if the database to open is an online database, false if it is offline
     * @return {*}
     */
    function openDbInternal(dbNameOrAddress, isOnlineDb) {
        let dbHandler = new PouchDB(dbNameOrAddress, {auto_compaction: true});
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
            let wasAlreadySynced = localStorageService.isDatabaseSynced(databaseName);
            if (!wasAlreadySynced && !justCreated) {
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
                    triggerConnectionLost();
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
                localStorageService.markSyncedDatabase(databaseName);
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
        if (_closed) {
            return;
        }
        try {
            _syncState = syncState;
            $(document).trigger(constants.EVENT_DB_SYNC_STATE_CHANGE, syncState);
        } catch (e) {
            log.error(e);
        }
    }

    function triggerConnectionLost() {
        if (_closed) {
            return;
        }
        thiz.cancelSync();
        if (_remoteDb) {
            _remoteDb.close();
            _remoteDb = null;
        }
        $(document).trigger(constants.EVENT_DB_CONNECTION_LOST);
        setSyncState(constants.DB_SYNC_STATE_FAIL);
    }

    function handleDbChange(info) {
        //in try-catch because if any event-handler throws an error this will
        //trigger the pouchDb error-handler which is not desired
        if (!changeHandler) {
            return;
        }

        try {
            log.debug(info);
            let changedIds = [];
            let changedDocsEncrypted = [];
            if (info.direction && info.direction === 'pull') {
                if (info.change && info.change.docs && info.change.docs.length > 0) {
                    changedDocsEncrypted = info.change.docs.filter(doc => !!doc.id);
                    changedIds = changedDocsEncrypted.map(doc => doc.id);
                }
                log.info('pouchdb pulling updates...');
            } else if (info.direction) {
                log.info('pouchdb pushing updates...');
            } else if (!info.direction && info.id) {
                log.info('change from remote database...');
                changedIds.push(info.id);
                if (info.doc) {
                    changedDocsEncrypted.push(info.doc);
                }
            }
            if (!_closed && (changedIds.length > 0 || changedDocsEncrypted.length > 0)) {
                changeHandler(changedIds, changedDocsEncrypted);
            }
        } catch (e) {
            log.error(e);
        }
    }
}

export {PouchDbAdapter};