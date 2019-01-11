import PouchDB from 'PouchDB';

let pouchDbService = {};

let _dbName = 'asterics-ergo-grid';
let _db = null;
let _updateListeners = [];

/**
 * queries for encrypted objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @return {Promise}
 */
pouchDbService.query = function (objectType, id) {
    let modelName = objectType ? objectType.getModelName() : undefined;
    if (!modelName && !id) {
        log.error('did not specify objectType or id!');
    }

    return new Promise((resolve, reject) => {
        initPouchDB().then(() => {
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
};

/**
 * saves an object to database that is already encrypted
 *
 * @param objectType the objectType to save, e.g. "GridData"
 * @param data the encrypted data object to save
 * @return {Promise} promise that resolves if operation finished, rejects on a failure
 */
pouchDbService.save = function saveObjectInternalEncrypted(objectType, data) {
    log.debug('saving ' + objectType.getModelName() + '...');
    return new Promise((resolve, reject) => {
        if (!data || !data._id || !objectType || !objectType.getModelName || !data.encryptedDataBase64) {
            log.error('did not specify needed parameter "objectType" or "_id" or data is not encrypted! aborting.');
            return reject();
        }
        initPouchDB().then(() => {
            _db.put(data).then(() => {
                log.debug('updated ' + objectType.getModelName() + ', id: ' + data._id);
                resolve();
            }).catch(function (err) {
                log.error(err);
                reject();
            });
        });
    });
};

/**
 * Deletes an object from database.
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
pouchDbService.resetDatabase = function () {
    return new Promise(resolve => {
        initPouchDB().then(() => {
            return _db.destroy();
        }).then(function () {
            _db = null;
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
pouchDbService.registerUpdateListener = function (listener) {
    _updateListeners.push(listener);
};

/**
 * clears all update listeners
 */
pouchDbService.clearUpdateListeners = function () {
    _updateListeners = [];
};

function initPouchDB() {
    return new Promise(resolve => {
        if(_db) {
            resolve();
        } else {
            _db = new PouchDB(_dbName);
            _db.info().then(function (info) {
                log.debug(info);
            });
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
        }
    });
}

export {pouchDbService};