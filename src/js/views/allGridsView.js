import {dataService} from "../service/dataService";
import {GridData} from "../model/GridData.js";
import {Router} from "../router";
import {modelUtil} from "../util/modelUtil";
import Vue from 'vue';
import {I18nModule} from "./../i18nModule.js";

var AllGridsView = {};
var vueApp = null;

AllGridsView.init = function () {

    dataService.getGrids().then(grids => {
        log.debug(grids);
        initVue(grids);
    });
};

function initVue(grids) {
    vueApp = new Vue({
        el: '#app',
        data: {
            grids: JSON.parse(JSON.stringify(grids)), //hack because otherwise vueJS databinding sometimes does not work
            searchText: '',
            editModeId: '',
            originalLabel: ''
        },
        methods: {
            deleteGrid: function (id, label) {
                log.debug('delete: ' + id)
                if (!confirm(`Do you really want to delete the grid "${label}"?`)) {
                    return;
                }
                dataService.deleteGrid(id).then(() => {
                    this.reload();
                });
            },
            addGrid: function () {
                log.debug('add grid!');
                var existingNames = this.grids.map(grid => grid.label);
                var gridData = new GridData({
                    label: modelUtil.getNewName('newGrid', existingNames),
                    gridElements: []
                });
                dataService.saveGrid(gridData).then(() => {
                    this.editModeId = gridData.id;
                    this.reload();
                });
            },
            importFromFile: function (event) {
                var importFile = event.target.files[0];
                if(!importFile || !importFile.name) {
                    return;
                }

                var fileExtension = importFile.name.substring(importFile.name.length-4);
                if(fileExtension == '.grd') {
                    dataService.importGridsFromFile(importFile).then(() => {
                        this.reload();
                        var $el = $(event.target); //reset file input
                        $el.wrap('<form>').closest('form').get(0).reset();
                        $el.unwrap();
                    });
                }
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
            show(gridId) {
                Router.toGrid(gridId);
            },
            edit(gridId) {
                Router.toEditGrid(gridId);
            },
            back() {
                Router.back();
            },
            exportToFile(gridId) {
                if(gridId) {
                    dataService.downloadSingleGrid(gridId);
                } else {
                    dataService.downloadAllGrids();
                }
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
                    return grid.label ? grid.label.toLowerCase().includes(this.searchText.toLowerCase()) : false;
                })
            },
        },
        mounted: function () {
            initContextmenu();
            I18nModule.init();
        }
    })
}

function reinit() {
    window.location.reload();
}

function initContextmenu() {
    //see https://swisnl.github.io/jQuery-contextMenu/demo.html

    var CONTEXT_NEW = "CONTEXT_NEW";
    var CONTEXT_EXPORT = "CONTEXT_EXPORT";
    var CONTEXT_IMPORT = "CONTEXT_IMPORT";
    var CONTEXT_RESET = "CONTEXT_RESET";

    var itemsMoreMenu = {
        CONTEXT_NEW: {name: "New grid // Neues Grid", icon: "fas fa-plus"},
        CONTEXT_IMPORT: {name: "Import grid(s) from file // Grid(s) aus Datei importieren", icon: "fas fa-file-upload"},
        CONTEXT_EXPORT: {name: "Export all grids // Alle Grids exportieren", icon: "fas fa-hdd"},
        CONTEXT_RESET: {name: "Reset database // Datenbank zurücksetzen", icon: "fas fa-minus-circle"},
    };

    $.contextMenu({
        selector: '#moreButton',
        callback: function (key, options) {
            handleContextMenu(key);
        },
        trigger: 'left',
        items: itemsMoreMenu
    });

    function handleContextMenu(key, elementId) {
        switch (key) {
            case CONTEXT_NEW: {
                vueApp.addGrid();
                break;
            }
            case CONTEXT_IMPORT: {
                document.getElementById('inputFile').click();
                break;
            }
            case CONTEXT_EXPORT: {
                vueApp.exportToFile();
                break;
            }
            case CONTEXT_RESET: {
                vueApp.reset();
                break;
            }
        }
    }
}

export {AllGridsView};