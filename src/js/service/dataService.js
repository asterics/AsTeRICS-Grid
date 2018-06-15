import {L} from "../../lib/lquery.js";
import {GridElement} from "../model/GridElement.js";
import {GridData} from "../model/GridData.js";

var grids = [];
var verbs = ['be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call'];

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
            speakText: verbs[i%verbs.length],
            label: verbs[i%verbs.length]
        }))
    }
    grids.push(grid);
}
generateGridData();

var dataService = {
    getGrid: function (id) {
        return grids[0];
    },
    getGridElement: function (gridId, gridElementId) {
        var grid = this.getGrid(gridId);
        return grid.gridElements.filter(elm => elm.id == gridElementId)[0];
    }
};

export {dataService};