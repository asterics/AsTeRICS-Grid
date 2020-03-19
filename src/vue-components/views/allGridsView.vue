<template>
    <div class="all-grids-view overflow-content box">
        <header class="row header" role="banner">
            <header-icon></header-icon>
            <button tabindex="32" id="moreButton" title="More" class="small"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile" data-i18n>More // Mehr</span></button>
            <button tabindex="31" @click="addGrid()" class="spaced hide-mobile small"><i class="fas fa-plus"/> <span data-i18n="">New Grid // Neues Grid</span></button>
            <input tabindex="30" type="text" :placeholder="'PLACEHOLDER_SEARCH_GRID' | translate" class="spaced" style="width: 30vw" v-model="searchText">
            <div style="display: none">
                <input type="file" id="inputFile" @change="importFromFile" accept=".grd, .obf, .obz"/>
                <input type="file" id="inputFileBackup" @change="importBackupFromFile" accept=".grd, .obz"/>
            </div>
        </header>
        <div class="row content text-content">
            <div v-show="showLoading || grids === null" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative; margin-top: 30vh; top: 0"/>
                <div style="width: 100%; text-align: center; font-size: 2em; margin-top: 1em;">
                    <span v-if="progressText">{{progressText}} ...</span>
                </div>
            </div>
            <h2 data-i18n>Saved Grids // Gespeicherte Grids</h2>
            <ul id="gridList" v-show="filteredGrids.length > 0">
                <li class="hide-mobile table-headers">
                    <span class="four columns">Name</span>
                    <span class="four columns" data-i18n="">Actions // Aktionen</span><br/>
                </li>
                <li v-for="grid in filteredGrids" class="grid-table-elem">
                    <div class="row">
                        <div class="four columns" style="margin-bottom: 1.5vh">
                            <div v-if="editModeId !== grid.id">
                                <a :href="'#grid/' + grid.id">{{ grid.label }}</a>
                                <button class="small-button" @click="enableEdit(grid.id, grid.label)"><i class="far fa-edit"/></button>
                            </div>
                            <div v-if="editModeId === grid.id">
                                <input type="text" v-focus="" v-model="grid.label"/>
                                <div class="inline">
                                    <button class="small-button" v-if="originalLabel" @click="cancelEdit(grid.id)"><i class="fas fa-times"/></button>
                                    <button class="small-button" @click="finishEdit(grid.id, grid.label)" :disabled="isLabelDuplicate(grid.label)"><i class="fas fa-check"/></button>
                                </div>
                            </div>
                        </div>
                        <div class="eight columns" style="display: flex">
                            <div class="four columns show-mobile" style="margin: 0.5em 0 0 0.2em" data-i18n="">Actions // Aktionen</div>
                            <button @click="show(grid.id)"><i class="far fa-eye"/> <span class="hide-mobile" data-i18n="">Show // Öffnen</span></button>
                            <button @click="edit(grid.id)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span></button>
                            <button @click="clone(grid.id)"><i class="far fa-clone"/> <span class="hide-mobile" data-i18n="">Clone // Duplizieren</span></button>
                            <button @click="deleteGrid(grid.id, grid.label)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                            <button @click="exportToFile(grid.id)"><i class="fas fa-file-export"/> <span class="hide-mobile" data-i18n="">Export // Exportieren</span></button>
                        </div>
                    </div>
                </li>
            </ul>
            <p v-if="filteredGrids.length == 0" data-i18n>
                No Grids found! // Keine Ergebnisse gefunden!
            </p>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {dataService} from "../../js/service/data/dataService";
    import {GridData} from "../../js/model/GridData.js";
    import {Router} from "../../js/router";
    import {modelUtil} from "../../js/util/modelUtil";
    import {i18nService} from "../../js/service/i18nService";
    import {constants} from "../../js/util/constants";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {progressService} from "../../js/service/progressService";

    let SELECTOR_CONTEXTMENU = '#moreButton';

    let vueApp = null;
    let vueConfig = {
        components: {HeaderIcon},
        data() {
            return {
                grids: null,
                searchText: '',
                editModeId: '',
                originalLabel: '',
                showLoading: true,
                progressText: ''
            };
        },
        methods: {
            deleteGrid: function (id, label) {
                log.debug('delete: ' + id);
                if (!confirm(i18nService.translate('CONFIRM_DELETE_GRID', label))) {
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
            isLabelDuplicate: function (label) {
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
            exportToFile(gridId) {
                if (gridId) {
                    dataService.downloadSingleGrid(gridId);
                } else {
                    dataService.downloadAllGrids();
                    //dataService.downloadAllGridsSimple();
                }
            },
            importFromFile: function (event) {
                this.importFromFileInternal(event, false);
            },
            importBackupFromFile: function (event) {
                let name = event.target && event.target.files[0] && event.target.files[0] ? event.target.files[0].name : '';
                if (!confirm(i18nService.translate('CONFIRM_IMPORT_BACKUP', name))) {
                    this.resetFileInput(event);
                    return;
                }
                this.importFromFileInternal(event, true);
            },
            reload: function () {
                return dataService.getGrids().then(grids => {
                    this.grids = JSON.parse(JSON.stringify(grids));
                    return Promise.resolve();
                });
            },
            reset() {
                if (confirm(i18nService.translate('CONFIRM_RESET_DB'))) {
                    this.showLoading = true;
                    dataService.deleteAllGrids().then(() => {
                        window.location.reload();
                    });
                }
            },
            importFromFileInternal(event, reset) {
                let thiz = this;
                let importFile = event.target.files[0];
                if (!importFile || !importFile.name) {
                    return;
                }

                thiz.showLoading = true;
                dataService.importGridsFromFile(importFile, reset).then(() => {
                    this.resetFileInput(event);
                    this.reload().then(() => {
                        thiz.showLoading = false;
                    });
                });
            },
            resetFileInput(event) {
                var $el = $(event.target); //reset file input
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();
            }
        },
        computed: {
            filteredGrids: function () {
                if (!this.grids) {
                    return [];
                }
                return this.grids.filter(grid => {
                    return grid.label ? grid.label.toLowerCase().includes(this.searchText.toLowerCase()) : false;
                })
            },
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, thiz.reload);
            progressService.register(text => {
                thiz.progressText = text;
            });
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            dataService.getGrids().then(grids => {
                thiz.grids = JSON.parse(JSON.stringify(grids)); //hack because otherwise vueJS databinding sometimes does not work;
                initContextmenu();
                i18nService.initDomI18n();
                thiz.showLoading = false;
            });
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reload);
            $.contextMenu('destroy');
            progressService.clearHandlers();
        }
    };

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

        var CONTEXT_NEW = "CONTEXT_NEW";
        var CONTEXT_EXPORT = "CONTEXT_EXPORT";
        var CONTEXT_IMPORT = "CONTEXT_IMPORT";
        var CONTEXT_IMPORT_BACKUP = "CONTEXT_IMPORT_BACKUP";
        var CONTEXT_RESET = "CONTEXT_RESET";

        var itemsImportExport = {
            CONTEXT_EXPORT: {
                name: "Export all grids to file // Alle Grids als Datei exportieren",
                icon: "fas fa-file-export"
            },
            CONTEXT_IMPORT: {
                name: "Import grid(s) from file // Grid(s) aus Datei importieren",
                icon: "fas fa-file-import"
            },
            CONTEXT_IMPORT_BACKUP: {
                name: "Import backup from file // Backup aus Datei importieren",
                icon: "fas fa-file-import"
            },
            SEP2: "---------"
        };

        var itemsMoreMenu = {
            CONTEXT_NEW: {name: "New grid // Neues Grid", icon: "fas fa-plus"},
            SEP1: "---------",
            CONTEXT_EXPORT: {
                name: "Export all grids to file // Alle Grids als Datei exportieren",
                icon: "fas fa-file-export"
            },
            CONTEXT_IMPORT: {
                name: "Import grid(s) from file // Grid(s) aus Datei importieren",
                icon: "fas fa-file-import"
            },
            CONTEXT_IMPORT_BACKUP: {
                name: "Import backup from file // Backup aus Datei importieren",
                icon: "fas fa-file-import"
            },
            SEP2: "---------",
            //CONTEXT_SUB_IMPORT_EXPORT: {name: "Import / Export", icon: "fas fa-hdd", items: itemsImportExport},
            CONTEXT_RESET: {name: "Reset to default configuration // Auf Standardkonfiguration zurücksetzen", icon: "fas fa-minus-circle"},
        };

        $.contextMenu({
            selector: SELECTOR_CONTEXTMENU,
            callback: function (key, options) {
                handleContextMenu(key);
            },
            trigger: 'left',
            items: itemsMoreMenu,
            zIndex: 10
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
                case CONTEXT_IMPORT_BACKUP: {
                    document.getElementById('inputFileBackup').click();
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

    export default vueConfig;
</script>

<style scoped>
    .all-grids-view li {
        list-style-type: none;
    }

    .all-grids-view li button {
        width: 17%;
        padding: 0 1vh;
        margin: 0.5vh 0.5vw;
    }

    .all-grids-view a {
        font-size: 1.2em;
    }

    .all-grids-view .small-button {
        padding: 0;
        margin: 0.5em 0 0 0.5em;
        line-height: normal;
        width: 25px;
        height: 25px;
    }

    .all-grids-view .table-headers {
        margin-top: 1.0em;
    }

    /* Smaller than tablet */
    @media (max-width: 850px) {
        .all-grids-view a {
            font-size: 1.3em;
            margin-top: 1.5em;
        }

        .all-grids-view li {
            margin-top: 2em;
        }

        .all-grids-view .small-button {
            width: 30px;
            height: 30px;
        }

        .grid-table-elem {
            outline: 1px solid lightgray;
            padding: 0.5em;
            margin-right: 1em;
        }
    }
</style>