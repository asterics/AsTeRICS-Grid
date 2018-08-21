import Vue from 'vue'
import {Grid} from "../grid.js";
import {dataService} from "../service/dataService";

var GridEditView = {};

GridEditView.init = function (gridId) {
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            console.log('grid not found! gridId: ' + gridId);
            return;
        }
        GridEditView.gridData = grid;
        initVue();
    });
};

GridEditView.destroy = function () {
    GridEditView.grid = null;
};

function initVue() {
    var app = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridEditView.gridData)),
        },
        methods: {
            changeRowCount: function (event) {
                GridEditView.grid.setNumberOfRows(event.target.value);
            },
        },
        mounted: () => {
            initGrid().then(() => {
                GridEditView.grid.autosize();
            });
        },
        updated: () => {
            GridEditView.grid.autosize();
        }
    })
}

function initGrid() {
    GridEditView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: true,
        dragAndDrop: true,
        gridId: GridEditView.gridData.id
    });
    return GridEditView.grid.getInitPromise();
}

export {GridEditView};