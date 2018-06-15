import {L} from "../../lib/lquery.js";
import {GridElement} from "../model/GridElement.js";
import {GridData} from "../model/GridData.js";
import {localStorageService} from "./localStorageService";

var grids = null;
var verbs = ['be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call'];
var GRIDS_SAVE_KEY = "GRIDS_SAVE_KEY";


function getSavedGridData() {
    var json = localStorageService.get(GRIDS_SAVE_KEY);
    if(json) {
        var parsed = GridData.fromJSON(json);
        return parsed instanceof Array ? parsed : [parsed];
    }
    return null;
}

function generateGridData() {
    var _grids = [];
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
            speakText: verbs[i%verbs.length],
            label: verbs[i%verbs.length]
        }))
    }
    _grids.push(grid);
    return _grids;
}

function saveToLocalStorage() {
    var json = localStorageService.save(GRIDS_SAVE_KEY, JSON.stringify(grids));
}

function init() {
    grids = getSavedGridData();
    if(!grids) {
        grids = generateGridData();
        localStorageService.save(GRIDS_SAVE_KEY, JSON.stringify(grids));
        console.log('using generated data...');
    } else {
        console.log('using data from local storage...');
    }
}
init();

var dataService = {
    getGrid: function (id) {
        return grids[0];
    },
    getGridElement: function (gridId, gridElementId) {
        var grid = this.getGrid(gridId);
        return grid.gridElements.filter(elm => elm.id == gridElementId)[0];
    },
    saveGrid: function (gridData) {
        grids[0] = gridData; //TODO: adapt for more than 1 grid -> maybe object {id: GridData}?
        saveToLocalStorage();
    }
};

export {dataService};