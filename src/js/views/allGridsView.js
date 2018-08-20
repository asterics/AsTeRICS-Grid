import {dataService} from "../service/dataService";
import {GridData} from "../model/GridData.js";
import {GridElement} from "../model/GridElement.js";
import Vue from 'vue'

var AllGridsView = {};

AllGridsView.init = function () {

    dataService.getGrids().then(grids => {
        console.log(grids);
        initVue(grids);
    });
};

function initVue(grids) {
    var app = new Vue({
        el: '#app',
        data: {
            grids: grids,
            searchText: '',
            importFile: null,
        },
        methods: {
            deleteGrid: function (id, label) {
                console.log('delete: ' + id)
                if (!confirm(`Do you really want to delete the grid "${label}"?`)) {
                    return;
                }
                dataService.deleteGrid(id).then(() => {
                    this.reload();
                });
            },
            addGrid: function () {
                console.log('add grid!');
                dataService.saveGrid(new GridData({
                    label: 'test' + new Date().getTime(),
                    gridElements: [new GridElement({label: 'Test 1'}), new GridElement({label: 'Test 2'})]
                })).then(() => {
                    this.reload();
                });
            },
            exportToFile: function () {
                dataService.downloadDB();
            },
            importFromFile: function () {
                console.log(this.importFile);
                if(!confirm(`Do you really want to import all grids from "${this.importFile.name}"? Warning: This will delete all currently saved grids.`)) {
                    return;
                }
                dataService.importDB(this.importFile).then(() => {
                    reinit();
                });
            },
            changeFile: function (event) {
                this.importFile = event.target.files[0];
            },
            reload: function () {
                dataService.getGrids().then(grids => {
                    this.grids = grids;
                });
            }
        },
        computed: {
            filteredGrids() {
                return this.grids.filter(grid => {
                    return grid.label.toLowerCase().includes(this.searchText.toLowerCase())
                })
            }
        }
    })
}

function reinit() {
    window.location.reload();
}

export {AllGridsView};