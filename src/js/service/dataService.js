import PouchDB from 'PouchDB';
import FileSaver from 'file-saver';
import $ from 'jquery';

import {GridData} from "../model/GridData.js";
import {GridImage} from "../model/GridImage";
import {MetaData} from "../model/MetaData";
import {modelUtil} from "../util/modelUtil";
import {translateService} from "./translateService";

var dbName = 'asterics-ergo-grid';
var db = null;
var initPromise = null;
var defaultGridSetPath = 'examples/example_grids_de.grd';
var _updateListeners = [];

function initPouchDB() {
    return new Promise(resolve => {
        db = new PouchDB(dbName);
        var remoteDbAddress = 'http://' + window.location.hostname + ':5984/testdb';
        var remoteDB = new PouchDB(remoteDbAddress);
        log.info('trying to sync pouchdb with: ' + remoteDbAddress);
        db.sync(remoteDB, {
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
        });

        log.debug('create index');
        db.createIndex({
            index: {fields: ['modelName', 'id']}
        }).then(() => {
            resolve();
        });
    })
}

function resetPouchDB() {
    return new Promise(resolve => {
        db.destroy().then(function () {
            initPouchDB().then(() => resolve());
        }).catch(function (err) {
            log.error('error destroying database: ' + err);
        })
    });
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
            initPromise.then(() => {
                resolve();
            });
        }
    });
}

function init() {
    initPromise = new Promise((resolve => {
        initPouchDB().then(() => {
            db.info().then(function (info) {
                log.debug(info);
            });

            getInternal(GridData, null, true).then(grids => {
                if (grids) {
                    log.debug('detected saved grid, no generation of new grid.');
                    resolve();
                    return;
                } else {
                    $.get(defaultGridSetPath, function (data) {
                        log.info('importing default grid set...');
                        var gridsData = JSON.parse(data);
                        var promises = [];
                        gridsData.forEach(gridData => {
                            gridData._id = null;
                            gridData._rev = null;
                            promises.push(saveInternal(GridData, gridData, false, true));
                        });
                        Promise.all(promises).then(() => {
                            log.debug('imported default grid set!');
                            resolve();
                        });
                    });
                }
            });
        });
    }));
}

init();

/**
 * queries for objects in database and resolves promise with result.
 * If no elements are found 'null' is resolved, if exactly one element was found, this element is resolved,
 * otherwise an array of the found elements is resolved.
 *
 * @param objectType the objectType to find, e.g. "GridData"
 * @param id the id of the object to find (optional)
 * @param dontWaitOnInit if true, there is no waiting for init (for calling it in init)
 * @return {Promise}
 */
function getInternal(objectType, id, dontWaitOnInit) {
    if (!objectType || !objectType.getModelName) {
        log.error('did not specify needed parameter "objectType"!');
    }

    return new Promise((resolve, reject) => {
        waitForInit(dontWaitOnInit).then(() => {
            log.debug('getting ' + objectType.getModelName() + '(id: ' + id + ')...');
            var query = {
                selector: {
                    modelName: objectType.getModelName()
                }
            };
            if (id) {
                query.selector.id = id;
            }
            db.find(query).then(function (res) {
                var objects = [];
                if (res.docs && res.docs.length > 0) {
                    res.docs.forEach(doc => {
                        objects.push(new objectType(doc));
                    })
                }
                log.debug('found ' + objectType.getModelName() + ": " + objects.length + ' elements');
                if (objects.length == 0) {
                    resolve(null);
                } else if (objects.length == 1) {
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

function saveInternal(objectType, data, onlyUpdate, dontWaitOnInit) {
    if (!data || !objectType || !objectType.getModelName) {
        log.error('did not specify needed parameter "objectType"!');
    }

    log.debug('saving ' + objectType.getModelName() + '...');
    return new Promise((resolve, reject) => {
        waitForInit(dontWaitOnInit).then(() => {
            getInternal(objectType, data.id, dontWaitOnInit).then(existingObject => {
                if (existingObject) {
                    log.debug(objectType.getModelName() + ' already existing, doing update. id: ' + existingObject.id);
                    var newObject = new objectType(data, existingObject);
                    var saveData = JSON.parse(JSON.stringify(newObject));
                    saveData._id = existingObject._id;
                    saveData._rev = existingObject._rev;
                    db.put(saveData).then(() => {
                        log.debug('updated ' + objectType.getModelName() + ', id: ' + existingObject.id);
                        resolve();
                    }).catch(function (err) {
                        log.error(err);
                        reject();
                    });
                } else if (!onlyUpdate) {
                    var saveData = JSON.parse(JSON.stringify(data));
                    saveData._id = saveData.id;
                    db.put(saveData).then(() => {
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

/**
 * saves an element that can potentially be used in several places, and has high data volume and therefore
 * should only be saved once in the database (e.g. images, ARE Models).
 * To achieve this the data of the element is hashed and the hashes are saved in the MetaData.hashes object. If another
 * element produces the same hash it isn't saved a second time to the database, but the id of the existing element is
 * returned and can be used as a reference to the element.
 *
 * @param objectType the objectType to save, e.g. GridImage
 * @param data the data to be saved
 * @return {Promise} the promise resolves either to the id of the data that was newly saved or to the id of the
 * existing object in the database with the same hash
 */
function saveHashedItemInternal(objectType, data) {
    var promises = [];
    return new Promise((resolve, reject) => {
        dataService.getMetadata().then(metadata => {
            if(!metadata || ! metadata.hashCodes) {
                log.warn('error: hashCodes or metadata do not exist');
                reject();
                return;
            }
            var hashMap = null;
            if(metadata.hashCodes[objectType.getModelName()]) {
                hashMap = metadata.hashCodes[objectType.getModelName()];
            } else {
                hashMap = {};
                metadata.hashCodes[objectType.getModelName()] = hashMap;
            }
            var hash = modelUtil.hashCode(data);
            if(hashMap[hash]) {
                log.debug('saveHashedItemInternal: hash found, not saving new element');
                data.id = hashMap[hash];
            } else {
                log.debug('saveHashedItemInternal: hash not found, saving new element');
                hashMap[hash] = data.id;
                promises.push(saveInternal(objectType, data));
                promises.push(saveInternal(MetaData, metadata));
            }
            Promise.all(promises).then(() => {
                resolve(data.id);
            });
        });
    });
}

var dataService = {
    getGrid: function (id) {
        return new Promise(resolve => {
            getInternal(GridData, id).then(grids => {
                var retVal = grids && grids.length > 0 ? grids[0] : grids;
                resolve(retVal);
            });
        });
    },
    getGrids: function (id) {
        return new Promise(resolve => {
            getInternal(GridData, id).then(grids => {
                if(!grids) {
                    resolve([]);
                } else {
                    var retVal = grids instanceof Array ? grids : [grids];
                    resolve(retVal);
                }
            });
        });
    },
    getGridElement: function (gridId, gridElementId) {
        return new Promise(resolve => {
            this.getGrid(gridId).then(grid => {
                resolve(grid.gridElements.filter(elm => elm.id == gridElementId)[0]);
            });
        });
    },
    /**
     * returns a map with keys == gridIds and values of the given attribute parameter
     * e.g. attribute == "label" will return a map of <gridIds -> gridLabel>
     * @param attribute
     * @return {Promise}
     */
    getGridsAttribute(attribute) {
        return new Promise(resolve => {
            this.getGrids().then(grids => {
                var returnMap = {};
                grids.forEach(grid => {
                    returnMap[grid.id] = grid[attribute];
                });
                resolve(returnMap);
            })
        });
    },
    updateOrAddGridElement: function (gridId, updatedGridElement) {
        return new Promise(resolve => {
            this.getGrid(gridId).then(grid => {
                grid = JSON.parse(JSON.stringify(grid));
                updatedGridElement = JSON.parse(JSON.stringify(updatedGridElement));
                var index = grid.gridElements.map(el => el.id).indexOf(updatedGridElement.id);

                if(index != -1) {
                    grid.gridElements[index] = updatedGridElement;
                } else {
                    grid.gridElements.push(updatedGridElement);
                }

                this.updateGrid(gridId, grid).then(() => {
                    resolve();
                });
            });
        });
    },
    addGridElements: function (gridId, newGridElements) {
        return new Promise(resolve => {
            this.getGrid(gridId).then(grid => {
                grid = JSON.parse(JSON.stringify(grid));
                grid.gridElements = grid.gridElements.concat(newGridElements);
                this.updateGrid(gridId, grid).then(() => {
                    resolve();
                });
            });
        });
    },
    saveGrid: function (gridData) {
        return saveInternal(GridData, gridData);
    },
    updateGrid: function (gridId, newConfig) {
        newConfig.id = gridId;
        return saveInternal(GridData, newConfig, true);
    },
    deleteGrid: function (gridId) {
        return new Promise(resolve => {
            this.getGrid(gridId).then(grid => {
                db.remove(grid);
                log.debug('deleted grid from db! id: ' + gridId);
                resolve();
            })
        });
    },
    saveMetadata: function (newMetadata) {
        return new Promise(resolve => {
            this.getMetadata().then(existingMetadata => {
                if (existingMetadata) {
                    //new metadata is stored with ID of existing metadata -> there should only be one metadata object
                    var id = existingMetadata instanceof Array ? existingMetadata[0].id : existingMetadata.id;
                    newMetadata.id = id;
                }
                if(!existingMetadata.isEqual(newMetadata)) {
                    saveInternal(MetaData, newMetadata).then(() => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    },
    getMetadata: function () {
        return new Promise(resolve => {
            getInternal(MetaData).then(result => {
                if(!result) {
                    resolve(new MetaData());
                } else if(result instanceof Array) {
                    resolve(result[0]);
                } else {
                    resolve(result);
                }
            });
        });
    },
    /**
     * saves the given imageData, if it was not already saved
     * @param imgData
     * @return {Promise} the id of the newly saved image data or an id of an existing image data with the same hash
     */
    saveImage: function (imgData) {
        return saveHashedItemInternal(GridImage, imgData);
    },
    getImage: function (imgId) {
        return getInternal(GridImage, imgId);
    },
    downloadDB: function () {
        var dumpedString = '';
        var stream = new MemoryStream();
        stream.on('data', function (chunk) {
            dumpedString += chunk.toString();
        });

        db.dump(stream).then(function () {
            var blob = new Blob([dumpedString], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, "my-grids-backup.grb");
        }).catch(function (err) {
            log.error('error on dumping database: ', err);
        });
    },
    downloadSingleGrid(gridId) {
        this.getGrid(gridId).then(gridData => {
            if(gridData) {
                var blob = new Blob([JSON.stringify(gridData)], {type: "text/plain;charset=utf-8"});
                FileSaver.saveAs(blob, gridData.label + ".grd");
            }
        });
    },
    downloadAllGrids() {
        this.getGrids().then(grids => {
            if(grids) {
                var blob = new Blob([JSON.stringify(grids)], {type: "text/plain;charset=utf-8"});
                FileSaver.saveAs(blob, "my-gridset.grd");
            }
        });
    },
    importGridsFromFile(file) {
        var thiz = dataService;
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    var jsonString = e.target.result;
                    dataService.importGridsFromJSON(jsonString).then(() => {
                        resolve();
                    });
                }
            })(file);
            reader.readAsText(file);
        });
    },
    importGridsFromJSON(jsonString) {
        return new Promise(resolve => {
            var gridData = JSON.parse(jsonString);
            if (!(gridData instanceof Array)) {
                gridData = [gridData];
            }
            dataService.getGrids().then(grids => {
                var existingNames = grids.map(grid => grid.label);
                var existingIds = grids.map(grid => grid.id);
                var resolveFns = [];
                var failed = false;
                gridData.forEach(grid => {
                    if (!failed) {
                        if (existingIds.includes(grid.id)) {
                            alert(translateService.translate('ERROR_IMPORT_SAMEID', grid.label));
                            failed = true;
                            return;
                        }
                        grid.label = modelUtil.getNewName(grid.label, existingNames);
                        grid._id = null;
                        grid._rev = null;
                        resolveFns.push(dataService.saveGrid(grid));
                    }
                });
                Promise.all(resolveFns).then(() => {
                    resolve();
                });
            });
        });
    },
    importDB: function (file) {
        return new Promise(resolve => {
            var reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    var data = e.target.result;
                    resetPouchDB().then(() => {
                        log.debug('resetted pouchdb! loading from string...');
                        db.load(data).then(function () {
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
    },
    resetDB: function () {
        resetPouchDB().then(() => {
            window.location.reload();
        });
    }
    ,
    registerUpdateListener: function (listener) {
        _updateListeners.push(listener);
    },
    clearUpdateListeners() {
        _updateListeners = [];
    }
};

export {dataService};