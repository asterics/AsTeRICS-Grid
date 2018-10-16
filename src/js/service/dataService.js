import PouchDB from 'PouchDB';
import FileSaver from 'file-saver';

import {L} from "../../lib/lquery.js";
import {GridElement} from "../model/GridElement.js";
import {GridData} from "../model/GridData.js";
import {GridImage} from "../model/GridImage";
import {InputConfig} from "../model/InputConfig";
import {MetaData} from "../model/MetaData";
import {modelUtil} from "../util/modelUtil";
import {translateService} from "./translateService";

var verbs = ['be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call'];
var dbName = 'asterics-ergo-grid';
var db = null;
var initPromise = null;

function generateGridData() {
    var grid = new GridData({
        label: 'Default-Grid',
        gridElements: []
    });
    for (var i = 0; i < 50; i++) {
        var sizeX = L.getRandomInt(2, 2);
        var sizeY = L.getRandomInt(1, 1);
        grid.gridElements.push(new GridElement({
            width: sizeX,
            height: sizeY,
            label: verbs[i % verbs.length]
        }))
    }
    return grid;
}

function initPouchDB() {
    return new Promise(resolve => {
        db = new PouchDB(dbName);
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
                }
                saveInternal(GridData, generateGridData(), false, true).then(() => {
                    log.debug('generated and saved default grid...');
                    resolve();
                });
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
                saveInternal(MetaData, newMetadata).then(() => {
                    resolve();
                });
            });
        });
    },
    getMetadata: function () {
        return getInternal(MetaData);
    },
    saveImage: function (imgData) {
        return saveInternal(GridImage, imgData);
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
                    var data = e.target.result;
                    var gridData = JSON.parse(data);
                    if(!(gridData instanceof Array)) {
                        gridData = [gridData];
                    }
                    thiz.getGrids().then(grids => {
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
                                resolveFns.push(thiz.saveGrid(grid));
                            }
                        });
                        Promise.all(resolveFns).then(() => {
                            resolve();
                        });
                    });
                }
            })(file);
            reader.readAsText(file);
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
};

export {dataService};