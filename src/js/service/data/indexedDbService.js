import PouchDB from 'PouchDB';
import $ from 'jquery';

import {GridData} from "../../model/GridData.js";
import {urlParamService} from "../urlParamService";
import {MetaData} from "../../model/MetaData";
import {encryptionService} from "./encryptionService";
import {EncryptedObject} from "../../model/EncryptedObject";

let indexedDbService = {};

let _dbName = 'asterics-ergo-grid';
let _db = null;
let _initPromise = null;
let _defaultGridSetPath = 'examples/default.grd';
let _updateListeners = [];

/**
 * queries for objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @return {Promise}
 */
indexedDbService.getObject = function (objectType, id) {
    return getObjectInternal(objectType, id);
};

/**
 * Saves an object to database.
 *
 * @param objectType the objectType to save, e.g. "GridData"
 * @param data the data object to save
 * @param onlyUpdate if true no new object is created but only an existing updated. If onlyUpdate==true and there is no
 *        existing object with the same ID, nothing is done. If onlyUpdate==false a new object is created if no object
 *        with the same ID exists.
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
indexedDbService.saveObject = function (objectType, data, onlyUpdate) {
    return saveObjectInternal(objectType, data, onlyUpdate);
};

/**
 * Deletes an object from database.
 *
 * @param id ID of the object to delete.
 * @return {Promise} promise that resolves if operation finished
 */
indexedDbService.removeObject = function (id) {
    return new Promise(resolve => {
        getObjectInternalEncrypted(null, id).then(object => {
            _db.remove(object);
            log.debug('deleted object from db! id: ' + object.id);
            resolve();
        });
    });
};

/**
 * dumps the whole database to a String
 * @return {Promise} promise that resolves to a String containing the dumped database
 */
indexedDbService.dumpDatabase = function () {
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
indexedDbService.importDatabase = function (file) {
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                let data = e.target.result;
                indexedDbService.resetDatabase().then(() => {
                    log.debug('resetted pouchdb! loading from string...');
                    _db.load(data).then(function () {
                        log.debug('loaded db from string!');
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
 * resets the whole database
 * @return {Promise} resolves after reset is finished
 */
indexedDbService.resetDatabase = function () {
    return new Promise(resolve => {
        _db.destroy().then(function () {
            initPouchDB().then(() => resolve());
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
indexedDbService.registerUpdateListener = function (listener) {
    _updateListeners.push(listener);
};

/**
 * clears all update listeners
 */
indexedDbService.clearUpdateListeners = function () {
    _updateListeners = [];
};

function init() {
    _initPromise = new Promise(resolve => {
        initPouchDB().then(() => {
            if (urlParamService.shouldResetDatabase()) {
                indexedDbService.resetDatabase().then(() => {
                    initInternal();
                });
            } else {
                initInternal();
            }
        });

        function initInternal() {
            _db.info().then(function (info) {
                log.debug(info);
            });

            getObjectInternalEncrypted(MetaData, null, true).then(metadataObjects => {
                let promises = [];
                if(!metadataObjects) {
                    let metadata = new MetaData();
                    encryptionService.setEncryptionSalt(metadata.id);
                    promises.push(saveObjectInternal(MetaData, metadata, false, true));
                } else {
                    let metadata = metadataObjects instanceof Array ? metadataObjects[0] : metadataObjects;
                    encryptionService.setEncryptionSalt(metadata.id);
                }
                Promise.all(promises).then(() => {
                    getObjectInternal(GridData, null, true).then(grids => {
                        if (grids) {
                            log.debug('detected saved grid, no generation of new grid.');
                            resolve();
                            return;
                        } else {
                            $.get(_defaultGridSetPath, function (data) {
                                log.info('importing default grid set...');
                                let gridsData = JSON.parse(data);
                                let promises = [];
                                gridsData.forEach(gridData => {
                                    gridData._id = null;
                                    gridData._rev = null;
                                    promises.push(saveObjectInternal(GridData, gridData, false, true));
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

function initPouchDB() {
    return new Promise(resolve => {
        _db = new PouchDB(_dbName);
        //let remoteDbAddress = 'http://' + window.location.hostname + ':5984/testdb';
        //let remoteDB = new PouchDB(remoteDbAddress);
        //log.info('trying to sync pouchdb with: ' + remoteDbAddress);
        /*_db.sync(remoteDB, {
            live: true,
            retry: true
        }).on('change', function (info) {
            log.info('cpouchdb change:' + info.direction);
            if(info.direction == 'pull') {
                log.info('pouchdb pulling updates...');
                _updateListeners.forEach(listener => {
                    listener();
                })
            } else {
                log.info('pouchdb pushing updates...');
            }
        }).on('error', function (err) {
            log.warn('couchdb error');
        });*/

        log.debug('create index');
        _db.createIndex({
            index: {fields: ['modelName', 'id']}
        }).then(() => {
            resolve();
        });
    })
}

/**
 * returns a promise that is resolved if init is done.
 *
 * @param dontWait if provided, waiting is skipped and promise is resolved immediately
 * @return {Promise}
 */
function waitForInit(dontWait) {
    return new Promise(resolve => {
        if (dontWait) {
            resolve();
        } else {
            _initPromise.then(() => {
                resolve();
            });
        }
    });
}

/**
 * queries for decrypted objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @param dontWaitOnInit if true, there is no waiting for init (for calling it in init)
 * @return {Promise}
 */
function getObjectInternal(objectType, id, dontWaitOnInit) {
    return new Promise((resolve, reject) => {
        getObjectInternalEncrypted(objectType, id, dontWaitOnInit).then(result => {
            let decryptedObject = encryptionService.decryptObjects(result, objectType);
            resolve(decryptedObject);
        }).catch(reason => {
            reject(reason);
        })
    });
}

/**
 * saves an object to database
 *
 * @param objectType the objectType to save, e.g. "GridData"
 * @param data the data object to save
 * @param onlyUpdate if true no new object is created but only an existing updated. If onlyUpdate==true and there is no
 *        existing object with the same ID, nothing is done. If onlyUpdate==false a new object is created if no object
 *        with the same ID exists.
 * @param dontWaitOnInit if true, there is no waiting for init (for calling it in init)
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
function saveObjectInternal(objectType, data, onlyUpdate, dontWaitOnInit) {
    return new Promise((resolve, reject) => {
        let encryptedData = encryptionService.encryptObject(data);
        saveObjectInternalEncrypted(objectType, encryptedData, onlyUpdate, dontWaitOnInit).then(result => {
            resolve(result);
        }).catch(reason => {
            reject(reason);
        })
    });
}

/**
 * queries for encrypted objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @param dontWaitOnInit if true, there is no waiting for init (for calling it in init)
 * @return {Promise}
 */
function getObjectInternalEncrypted(objectType, id, dontWaitOnInit) {
    let modelName = objectType ? objectType.getModelName() : undefined;
    if (!modelName && !id) {
        log.error('did not specify objectType or id!');
    }

    return new Promise((resolve, reject) => {
        waitForInit(dontWaitOnInit).then(() => {
            log.debug('getting ' + modelName + '(id: ' + id + ')...');
            let query = {
                selector: {}
            };
            if (id) {
                query.selector.id = id;
            }
            if(modelName) {
                query.selector.modelName = modelName;
            }
            _db.find(query).then(function (res) {
                let objects = [];
                if (res.docs && res.docs.length > 0) {
                    res.docs.forEach(doc => {
                        objects.push(doc);
                    })
                }
                log.debug('found ' + modelName + ": " + objects.length + ' elements');
                if (objects.length === 0) {
                    resolve(null);
                } else if (objects.length === 1) {
                    resolve(objects[0]);
                } else {
                    resolve(objects);
                }
            }).catch(function (err) {
                log.error(err);
                reject();
            });
        });
    });
}

/**
 * saves an object to database that is already encrypted
 *
 * @param objectType the objectType to save, e.g. "GridData"
 * @param data the encrypted data object to save
 * @param onlyUpdate if true no new object is created but only an existing updated. If onlyUpdate==true and there is no
 *        existing object with the same ID, nothing is done. If onlyUpdate==false a new object is created if no object
 *        with the same ID exists.
 * @param dontWaitOnInit if true, there is no waiting for init (for calling it in init)
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
function saveObjectInternalEncrypted(objectType, data, onlyUpdate, dontWaitOnInit) {
    if (!data || !objectType || !objectType.getModelName || !data.encryptedDataBase64) {
        log.error('did not specify needed parameter "objectType" or data is not encrypted!');
    }

    log.debug('saving ' + objectType.getModelName() + '...');
    return new Promise((resolve, reject) => {
        waitForInit(dontWaitOnInit).then(() => {
            getObjectInternalEncrypted(objectType, data.id, dontWaitOnInit).then(existingObject => {
                if (existingObject) {
                    log.debug(objectType.getModelName() + ' already existing, doing update. id: ' + existingObject.id);
                    let newObject = new EncryptedObject(data, existingObject);
                    let saveData = JSON.parse(JSON.stringify(newObject));
                    saveData._id = existingObject._id;
                    saveData._rev = existingObject._rev;
                    _db.put(saveData).then(() => {
                        log.debug('updated ' + objectType.getModelName() + ', id: ' + existingObject.id);
                        resolve();
                    }).catch(function (err) {
                        log.error(err);
                        reject();
                    });
                } else if (!onlyUpdate) {
                    let saveData = JSON.parse(JSON.stringify(data));
                    saveData._id = saveData.id;
                    _db.put(saveData).then(() => {
                        log.debug('saved ' + objectType.getModelName() + ', id: ' + saveData.id);
                        resolve();
                    }).catch(function (err) {
                        log.error(err);
                        reject();
                    });
                } else {
                    log.warn('no existing ' + objectType.getModelName() + ' found to update, aborting.');
                    reject();
                }
            });
        });
    });
}

//auto-init module
init();

export {indexedDbService};