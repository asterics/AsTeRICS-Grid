import PouchDB from 'PouchDB';
import FileSaver from 'file-saver';

import {L} from "../../lib/lquery.js";
import {GridElement} from "../model/GridElement.js";
import {GridData} from "../model/GridData.js";
import {ScanningConfig} from "../model/ScanningConfig";

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
            speakText: verbs[i % verbs.length],
            label: verbs[i % verbs.length]
        }))
    }
    return grid;
}

function initPouchDB() {
    return new Promise(resolve => {
        db = new PouchDB(dbName);
        console.log('create index');
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
            console.log('error destroying database: ' + err);
        })
    });
}

function getGridsInternal(id) {
    return new Promise(resolve => {
        var query = {
            selector: {
                modelName: GridData.getModelName()
            }
        };
        if (id) query.selector.id = id;
        db.find(query).then(function (res) {
            var grids = [];
            if (res.docs && res.docs.length > 0) {
                res.docs.forEach(doc => {
                    grids.push(new GridData(doc));
                })
            }
            if (id) {
                resolve(grids.length > 0 ? grids[0] : null);
            } else {
                resolve(grids);
            }
        }).catch(function (err) {
            console.log(err);
        });
    });
}

function init() {
    initPromise = new Promise((resolve => {
        initPouchDB().then(() => {
            db.info().then(function (info) {
                console.log(info);
            });

            getGridsInternal().then(grids => {
                if (grids.length > 0) {
                    console.log('detected saved grid, no generation of new grid.');
                    resolve();
                    return;
                }
                var grid = generateGridData();
                db.post(JSON.parse(JSON.stringify(grid))).then(function (res) {
                    console.log('generated and saved default grid...');
                    resolve();
                }).catch(function (err) {
                    console.log(err);
                });
            });
        });
    }));
}

init();

var dataService = {
    getGrid: function (id) {
        return this.getGrids(id);
    },
    getGrids: function (id) {
        return new Promise(resolve => {
            initPromise.then(() => {
                getGridsInternal(id).then(grids => {
                    resolve(grids);
                })
            });
        });
    },
    getScanningConfig: function (id) {
        return new Promise(resolve => {
            initPromise.then(() => {
                var grid = this.getGrid(id).then(grid => {
                    resolve(grid ? grid.scanningConfig : new ScanningConfig())
                });
            });
        });
    },
    getGridElement: function (gridId, gridElementId) {
        return new Promise(resolve => {
            initPromise.then(() => {
                var grid = this.getGrid(gridId).then(grid => {
                    resolve(grid.gridElements.filter(elm => elm.id == gridElementId)[0]);
                });
            });
        });

    },
    saveGrid: function (gridData) {
        var starttime = new Date().getTime();
        console.log('saving grid...');
        initPromise.then(() => {
            this.getGrid(gridData.id).then(grid => {
                var saveData = JSON.parse(JSON.stringify(gridData));
                saveData._id = grid._id;
                saveData._rev = grid._rev;
                db.put(saveData).then(() => {
                    console.log('saved grid in ' + (new Date().getTime() - starttime) + 'ms!');
                });
            })
        });
    },
    updateGrid: function (gridId, newConfig) {
        initPromise.then(() => {
            this.getGrid(gridId).then(grid => {
                var newGrid = new GridData(newConfig, grid);
                this.saveGrid(newGrid);
            });
        });
    },
    updateScanningConfig: function (gridId, newConfig) {
        initPromise.then(() => {
            this.getGrid(gridId).then(grid => {
                var newScanningConfig = new ScanningConfig(newConfig, grid.scanningConfig);
                grid.scanningConfig = newScanningConfig;
                this.saveGrid(grid);
            });
        });
    },
    downloadDB: function () {
        var dumpedString = '';
        var stream = new MemoryStream();
        stream.on('data', function (chunk) {
            dumpedString += chunk.toString();
        });

        db.dump(stream).then(function () {
            var blob = new Blob([dumpedString], {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(blob, "my-grids.grd");
        }).catch(function (err) {
            console.log('error on dumping database: ', err);
        });
    },
    importDB: function (file) {
        return new Promise(resolve => {
            var reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    var data = e.target.result;
                    console.log(data);
                    resetPouchDB().then(() => {
                        console.log('resetted pouchdb! loading from string...');
                        db.load(data).then(function () {
                            console.log('loaded db from string!');
                            resolve();
                        }).catch(function (err) {
                            console.log('error loading db from string: ' + err);
                        });
                    });
                };
            })(file);
            reader.readAsText(file);
        });
    }
};

export {dataService};