import Vue from 'vue'
import $ from 'jquery';
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
                initContextmenu();
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

function initContextmenu() {
    $.contextMenu({
        selector: '.grid-item-content',
        callback: function(key, options) {
            var m = "clicked: " + key;
            window.console && console.log(m) || alert(m);
        },
        items: {
            "edit": {name: "Edit", icon: "fas fa-edit"},
            "cut": {name: "Cut", icon: "cut"},
            copy: {name: "Copy", icon: "copy"},
            "paste": {name: "Paste", icon: "paste"},
            "delete": {name: "Delete", icon: "delete"},
            "sep1": "---------",
            "quit": {name: "Quit", icon: function(){
                return 'context-menu-icon context-menu-icon-quit';
            }}
        }
    });

    $('.context-menu-one').on('click', function(e){
        console.log('clicked', this);
    })
}

export {GridEditView};