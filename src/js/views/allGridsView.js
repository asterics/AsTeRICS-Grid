import {dataService} from "../service/data/dataService";
import {GridData} from "../model/GridData.js";
import {Router} from "../router";
import {modelUtil} from "../util/modelUtil";
import Vue from 'vue';
import {I18nModule} from "./../i18nModule.js";
import {translateService} from "./../service/translateService";
import {indexedDbService} from "../service/data/indexedDbService";

var AllGridsView = {};
var vueApp = null;

AllGridsView.init = function () {

    dataService.getGrids().then(grids => {
        log.debug(grids);
        initVue(grids);
    });
};

AllGridsView.destroy = function () {
    dataService.clearUpdateListeners();
};

function initVue(grids) {
    vueApp = new Vue({
        el: '#app',
        data: {
            grids: JSON.parse(JSON.stringify(grids)), //hack because otherwise vueJS databinding sometimes does not work
            searchText: '',
            editModeId: '',
            originalLabel: '',
            showLoading: true,
        },
        methods: {
            deleteGrid: function (id, label) {
                log.debug('delete: ' + id);
                if (!confirm(translateService.translate('CONFIRM_DELETE_GRID', label))) {
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
            clone(gridId) {
                var thiz = this;
                dataService.getGrid(gridId).then(grid => {
                    dataService.saveGrid(grid.clone()).then(() => {
                        thiz.reload();
                    });
                })
            },
            back() {
                Router.back();
            },
            exportToFile(gridId) {
                if(gridId) {
                    dataService.downloadSingleGrid(gridId);
                } else {
                    dataService.downloadAllGrids();
                    //dataService.downloadAllGridsSimple();
                }
            },
            importFromFile: function (event) {
                this.importFromFileInternal(event, '.grd', dataService.importGridsFromFile);
            },
            backupToFile() {
                dataService.downloadDB();
            },
            restoreBackupFromFile: function (event) {
                if(confirm(translateService.translate('CONFIRM_IMPORT_BACKUP', event.target.files[0].name))) {
                    this.importFromFileInternal(event, '.grb', indexedDbService.importDatabase);
                } else {
                    this.resetFileInput(event);
                }
            },
            reload: function () {
                dataService.getGrids().then(grids => {
                    this.grids = JSON.parse(JSON.stringify(grids));
                });
            },
            reset() {
                if(confirm(translateService.translate('CONFIRM_RESET_DB'))) {
                    this.showLoading = true;
                    indexedDbService.resetDatabase().then(() => {
                        window.location.reload();
                    });
                }
            },
            importFromFileInternal(event, extension, callFunction) {
                var importFile = event.target.files[0];
                if(!importFile || !importFile.name || !callFunction) {
                    return;
                }

                var fileExtension = importFile.name.substring(importFile.name.length-4);
                if(fileExtension == extension) {
                    callFunction(importFile).then(() => {
                        this.reload();
                        this.resetFileInput(event);
                    });
                }
            },
            resetFileInput(event) {
                var $el = $(event.target); //reset file input
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();
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
            var thiz = this;
            initContextmenu();
            I18nModule.init();
            thiz.showLoading = false;
            dataService.registerUpdateListener(function () {
                thiz.reload();
            });
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
    var CONTEXT_BACKUP = "CONTEXT_BACKUP";
    var CONTEXT_BACKUP_RESTORE = "CONTEXT_BACKUP_RESTORE";
    var CONTEXT_RESET = "CONTEXT_RESET";

    var itemsImportExport = {
        CONTEXT_EXPORT: {name: "Export all grids to file // Alle Grids als Datei exportieren", icon: "fas fa-file-export"},
        CONTEXT_IMPORT: {name: "Import grid(s) from file // Grid(s) aus Datei importieren", icon: "fas fa-file-import"},
        SEP2: "---------",
        CONTEXT_BACKUP: {name: "Backup complete configuration to file // Gesamte Konfiguration als Datei sichern", icon: "fas fa-download"},
        CONTEXT_BACKUP_RESTORE: {name: "Restore backup from file // Sicherung von Datei wiederherstellen", icon: "fas fa-upload"},
    };

    var itemsMoreMenu = {
        CONTEXT_NEW: {name: "New grid // Neues Grid", icon: "fas fa-plus"},
        SEP1: "---------",
        CONTEXT_EXPORT: {name: "Export all grids to file // Alle Grids als Datei exportieren", icon: "fas fa-file-export"},
        CONTEXT_IMPORT: {name: "Import grid(s) from file // Grid(s) aus Datei importieren", icon: "fas fa-file-import"},
        SEP2: "---------",
        CONTEXT_BACKUP: {name: "Backup complete configuration to file // Gesamte Konfiguration als Datei sichern", icon: "fas fa-download"},
        CONTEXT_BACKUP_RESTORE: {name: "Restore backup from file // Sicherung von Datei wiederherstellen", icon: "fas fa-upload"},
        //CONTEXT_SUB_IMPORT_EXPORT: {name: "Import / Export", icon: "fas fa-hdd", items: itemsImportExport},
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
            case CONTEXT_BACKUP: {
                vueApp.backupToFile();
                break;
            }
            case CONTEXT_BACKUP_RESTORE: {
                document.getElementById('inputFileBackup').click();
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