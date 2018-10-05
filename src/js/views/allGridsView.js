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
            grids: JSON.parse(JSON.stringify(grids)), //hack because otherwise vueJS databinding sometimes does not work
            searchText: '',
            importFile: null,
            editModeId: '',
            originalLabel: ''
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
                var gridData = new GridData({
                    label: 'newGrid - ' + new Date().getTime(),
                    gridElements: []
                });
                dataService.saveGrid(gridData).then(() => {
                    this.editModeId = gridData.id;
                    this.reload();
                });
            },
            exportToFile: function () {
                dataService.downloadDB();
            },
            importFromFile: function () {
                console.log(this.importFile);
                if (!confirm(`Do you really want to import all grids from "${this.importFile.name}"? Warning: This will delete all currently saved grids.`)) {
                    return;
                }
                dataService.importDB(this.importFile).then(() => {
                    reinit();
                });
            },
            changeFile: function (event) {
                this.importFile = event.target.files[0];
            },
            finishEdit: function (id, label) {
                dataService.updateGrid(id, {label: label});
                this.editModeId = '';
                this.originalLabel = '';
            },
            enableEdit: function (id, label) {
                this.editModeId = id;
                this.originalLabel = label;
            },
            cancelEdit: function (id) {
                this.editModeId = '';
                this.grids.filter(grd => grd.id == id)[0].label = this.originalLabel;
                this.originalLabel = '';
            },
            isLabelDuplicate: function(label) {
                return this.grids.map(g => g.label).filter(l => l == label).length > 1
            },
            reload: function () {
                dataService.getGrids().then(grids => {
                    this.grids = JSON.parse(JSON.stringify(grids));
                });
            },
            reset: () => {
                if(confirm('Do you really want to reset the database? All data will be deleted!'))
                dataService.resetDB();
            }
        },
        computed: {
            filteredGrids: function () {
                return this.grids.filter(grid => {
                    return grid.label.toLowerCase().includes(this.searchText.toLowerCase())
                })
            },
        }
    })
}

function reinit() {
    window.location.reload();
}

export {AllGridsView};