import PouchDB from 'PouchDB';
import {localStorageService} from "./localStorageService";

let DEFAULT_DB_NAME = 'localDB';
let pouchDbService = {};

let _dbName = DEFAULT_DB_NAME;
let _db = null;
let _remoteDb = null;
let _updateListeners = [];
let _syncHandler = null;

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
    return queryInternal(modelName, id, _db)
};

/**
 * queries for encrypted objects in local and remote database and resolves promise with result.
 * If no elements are found 'null' is resolved, otherwise an array of the found elements is resolved.
 *
 * @param modelName the modelName to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @return {Promise}
 */
pouchDbService.queryLocalAndRemote = function (modelName, id) {
    let promises = [];
    promises.push(queryInternal(modelName, id, _db));
    if (_remoteDb) {
        promises.push(queryInternal(modelName, id, _remoteDb));
    }
    return Promise.all(promises).then(results => {
        let result = [];
        if (results[0]) {
            result = result.concat(results[0]);
        }
        if (results[1]) {
            result = result.concat(results[1]);
        }
        log.debug('got local results: ' + results[0]);
        log.debug('got remote results: ' + results[1]);
        return Promise.resolve(result);
    });
};

/**
 * returns (resolves) all documents that are stored in pouchDb.
 * @return {Promise}
 */
pouchDbService.all = function () {
    return new Promise((resolve, reject) => {
        _db.allDocs({
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
    return new Promise((resolve, reject) => {
        if (!data || !data._id || !modelName || !data.encryptedDataBase64) {
            log.error('did not specify needed parameter "modelName" or "_id" or data is not encrypted! aborting.');
            return reject();
        }
        _db.put(data).then(() => {
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
    return pouchDbService.query(null, id).then(object => {
        log.debug('deleted object from db! id: ' + object.id);
        return _db.remove(object);
    });
};

/**
 * dumps the whole database to a String
 * @return {Promise} promise that resolves to a String containing the dumped database
 */
pouchDbService.dumpDatabase = function () {
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
    if(_dbName !== DEFAULT_DB_NAME) {
        return Promise.reject();
    }
    return new Promise(resolve => {
        _db.destroy().then(function () {
            _db = null;
            pouchDbService.setUser(localStorageService.getLastActiveUser()).then(() => resolve());
        }).catch(function (err) {
            log.error('error destroying database: ' + err);
        })
    });
};

/**
 * Registers an update listener. All registered listeners are called if an update event from the remote couchDB
 * is received.
 * @param listener a function that should be called on remote database updates
 */
pouchDbService.registerUpdateListener = function (listener) {
    _updateListeners.push(listener);
};

/**
 * clears all update listeners
 */
pouchDbService.clearUpdateListeners = function () {
    _updateListeners = [];
};

pouchDbService.setUser = function (username, remoteCouchDbAddress) {
    if (_syncHandler) {
        _syncHandler.cancel();
    }
    let promises = [];
    if (_db) promises.push(_db.close());
    if (_remoteDb) promises.push(_remoteDb.close());

    return Promise.all(promises).then(function () {
        _db = null;
        _remoteDb = null;
        _dbName = username || DEFAULT_DB_NAME;
        log.info('initializing database: ' + _dbName);
        _updateListeners = [];
        return initPouchDB(remoteCouchDbAddress);
    });
};

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
            let length = objects ? objects.length : 0;
            log.debug('found ' + modelName + ": " + length + ' elements');
            resolve(objects);
        }).catch(function (err) {
            log.error(err);
            reject();
        });
    });
}

function initPouchDB(remoteCouchDbAddress) {
    _db = new PouchDB(_dbName);
    _db.info().then(function (info) {
        log.debug(info);
    });
    if (remoteCouchDbAddress) {
        log.info('sync database with: ' + remoteCouchDbAddress);
        _remoteDb = new PouchDB(remoteCouchDbAddress);
        log.info('trying to sync pouchdb with: ' + remoteCouchDbAddress);
        _syncHandler = _db.sync(_remoteDb, {
            live: true,
            retry: true
        }).on('change', function (info) {
            log.info('couchdb change:' + info.direction);
            log.info(info);
            if (info.direction === 'pull') {
                log.info('pouchdb pulling updates...');
                _updateListeners.forEach(listener => {
                    listener();
                })
            } else {
                log.info('pouchdb pushing updates...');
            }
        }).on('error', function (err) {
            log.warn('couchdb error');
        }).on('complete', function (info) {
            log.info('couchdb sync complete!');
        });
    }

    log.debug('create index');
    return _db.createIndex({
        index: {fields: ['modelName', 'id']}
    });
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