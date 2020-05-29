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
        <div class="row content">
            <div v-show="showLoading || grids === null" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative; margin-top: 30vh; top: 0"/>
                <div style="width: 100%; text-align: center; font-size: 2em; margin-top: 1em;">
                    <span v-if="progressText">{{progressText}} ...</span>
                </div>
            </div>

            <accordion :acc-label="headerDetails" acc-label-type="h1" acc-background-color="white" acc-open="true" ref="accDetails">
                <div class="row" v-if="selectedGraphElement">
                    <div class="five columns">
                        <img :src="selectedGraphElement.grid.thumbnail ? selectedGraphElement.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%; border: 1px solid lightgray"/>
                    </div>
                    <div class="five columns" style="margin-bottom: 1.5em">
                        <label for="gridName" data-i18n="" style="display: block">Name of grid // Grid-Name</label>
                        <input id="gridName" type="text" v-model="newLabel" style="width: 77%"/>
                        <button @click="saveGridLabel" :disabled="isLabelDuplicate(newLabel)" :title="i18nService.translate('Save name // Name speichern')" style="width: 17%; padding: 0 1%"><i class="fas fa-check"/></button>
                    </div>
                </div>
                <div class="row" style="margin-bottom: 0.5em">
                    <label for="actionGroup" data-i18n="">Actions // Aktionen</label>
                </div>
                <div id="actionGroup" class="action-buttons">
                    <div style="display: flex">
                        <button @click="show(selectedGraphElement.grid.id)"><i class="far fa-eye"/> <span class="hide-mobile" data-i18n="">Show // Öffnen</span></button>
                        <button @click="edit(selectedGraphElement.grid.id)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span></button>
                        <button @click="clone(selectedGraphElement.grid.id)"><i class="far fa-clone"/> <span class="hide-mobile" data-i18n="">Clone // Duplizieren</span></button>
                        <button @click="deleteGrid(selectedGraphElement.grid.id, selectedGraphElement.grid.label)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                        <button @click="exportToFile(selectedGraphElement.grid.id)"><i class="fas fa-file-export"/> <span class="hide-mobile" data-i18n="">Export // Exportieren</span></button>
                    </div>
                </div>
                <div v-if="graphList && selectedGraphElement" class="row">
                    <h3 data-i18n="">Connected grids // Verknüpfte Grids</h3>
                    <ul>
                        <li>
                            <a v-for="relative in selectedGraphElement.allRelatives" href="javascript:;" @click="setSelectedGraphElement(relative)" style="text-decoration: none;">
                                <div style="display: inline-block; margin-right: 2em">
                                    <div>{{relative.grid.label}}</div>
                                    <img :src="relative.grid.thumbnail ? relative.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%; border: 1px solid lightgray"/>
                                </div>
                            </a>
                        </li>
                    </ul>
                    <span v-if="selectedGraphElement.allRelatives.length === 0" data-i18n="">(no connected grids) // (keine verknüpften Grids)</span>
                </div>
            </accordion>

            <accordion acc-label="Not reachable grids // Nicht erreichbare Grids" acc-label-type="h1" acc-background-color="white">
                <div v-if="graphList && selectedGraphElement" class="row">
                    <ul>
                        <li>
                            <a v-for="elem in graphList.filter(e => e.parents.length === 0)" href="javascript:;" @click="setSelectedGraphElement(elem)" style="text-decoration: none;">
                                <div style="display: inline-block; margin-right: 2em">
                                    <div>{{elem.grid.label}}</div>
                                    <img :src="elem.grid.thumbnail ? elem.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%; border: 1px solid lightgray"/>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </accordion>

            <accordion acc-label="Global grid // Globales Grid" acc-label-type="h1" acc-background-color="white">
                <h2 data-i18n>Global grid // Globales Grid</h2>
                <p data-i18n="">A global grid is shown within each other grid and can contain elements like e.g. "back" or "home". // Ein globales Grid wird innerhalb jedes anderen Grids angezeigt und kann beispielsweise Elemente wie "Zurück" oder "Zum Start" beinhalten.</p>
                <div class="row">
                    <label class="four columns" for="globalGridActions" data-i18n="">Actions for global grid // Aktionen für globales Grid</label>
                    <div id="globalGridActions" class="eight columns" v-if="metadata">
                        <button v-show="!metadata.globalGridActive || !hasGlobalGrid" @click="setGlobalGridActive(true)"><i class="fas fa-globe"/> <span data-i18n="">Activate global Grid // Globales Grid aktivieren</span></button>
                        <button v-show="metadata.globalGridActive && hasGlobalGrid" @click="setGlobalGridActive(false)"><i class="fas fa-globe"/> <span data-i18n="">Deactivate global Grid // Globales Grid deaktivieren</span></button>
                        <button :disabled="!metadata.globalGridActive" @click="edit(metadata.globalGridId)"><i class="fas fa-edit"/> <span data-i18n="">Edit global Grid // Globales Grid bearbeiten</span></button>
                        <button :disabled="!metadata.globalGridActive" @click="resetGlobalGrid()"><i class="fas fa-undo"/> <span data-i18n="">Reset global grid to default // Globales Grid zurücksetzen</span></button>
                    </div>
                </div>
            </accordion>

            <div class="row" style="margin-bottom: 10em"></div>
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
    import {gridUtil} from "../../js/util/gridUtil";
    import Accordion from "../components/accordion.vue";
    import {imageUtil} from "../../js/util/imageUtil";

    let SELECTOR_CONTEXTMENU = '#moreButton';

    let vueApp = null;
    let vueConfig = {
        components: {Accordion, HeaderIcon},
        data() {
            return {
                metadata: null,
                grids: null,
                graphList: null,
                selectedGraphElement: null,
                searchText: '',
                newLabel: '',
                showLoading: true,
                progressText: '',
                i18nService: i18nService,
                imageUtil: imageUtil
            };
        },
        methods: {
            setSelectedGraphElement(element) {
                this.selectedGraphElement = element;
                this.newLabel = this.selectedGraphElement.grid.label;
                this.$refs.accDetails.open();
                $(".all-grids-view").animate({ scrollTop: 0 }, 200);
            },
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
                    this.reload(gridData.id);
                    $('#gridName').focus();
                });
            },
            isLabelDuplicate: function (label) {
                return !label || this.grids.map(g => g.label).filter(l => l === label).length > 0;
            },
            saveGridLabel() {
                this.selectedGraphElement.grid.label = this.newLabel;
                dataService.updateGrid(this.selectedGraphElement.grid.id, {
                    label: this.newLabel
                });
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
                    let clonedGrid = grid.clone();
                    dataService.saveGrid(clonedGrid).then(() => {
                        thiz.reload(clonedGrid.id);
                    });
                })
            },
            exportToFile(gridId) {
                if (gridId) {
                    dataService.downloadSingleGrid(gridId);
                } else {
                    dataService.downloadBackup();
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
            reload: function (openGridId) {
                let thiz = this;
                return dataService.getMetadata().then(metadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(metadata));
                    return dataService.getGrids();
                }).then(grids => {
                    thiz.grids = JSON.parse(JSON.stringify(grids)); //hack because otherwise vueJS databinding sometimes does not work;
                    thiz.showLoading = false;
                    thiz.graphList = gridUtil.getGraphList(thiz.grids, thiz.metadata.globalGridId);
                    let gridToOpen = openGridId || thiz.metadata.lastOpenedGridId;
                    thiz.setSelectedGraphElement(thiz.graphList.filter(graphItem => graphItem.grid.id === gridToOpen)[0] || thiz.graphList[0]);
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
            setGlobalGridActive(active) {
                if (!this.hasGlobalGrid) {
                    return this.resetGlobalGrid(true);
                }
                this.metadata.globalGridActive = active;
                dataService.saveMetadata(this.metadata);
            },
            resetGlobalGrid(noConfirm) {
                if (!noConfirm) {
                    if (!confirm(i18nService.translate('Do you really want to reset the global grid to default? // Möchten Sie das globale Grid wirklich zurücksetzen?'))) {
                        return;
                    }
                }
                dataService.getGlobalGrid(true).then(existingGlobal => {
                    return existingGlobal ? dataService.deleteGrid(existingGlobal.id) : Promise.resolve();
                }).then(() => {
                    let globalGrid = gridUtil.generateGlobalGrid(this.grids[0].id);
                    this.metadata.globalGridId = globalGrid.id;
                    this.metadata.globalGridActive = true;
                    return dataService.saveGrid(globalGrid);
                }).then(() => {
                    return dataService.saveMetadata(this.metadata);
                }).then(() => {
                    this.reload();
                });
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
                    this.reload();
                });
            },
            resetFileInput(event) {
                var $el = $(event.target); //reset file input
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();
            }
        },
        computed: {
            headerDetails: function() {
                return this.selectedGraphElement ? i18nService.translate('Details for grid {?} // Details für Grid {?}', `"${this.selectedGraphElement.grid.label}"`) :'';
            },
            hasGlobalGrid: function() {
                if (!this.grids || !this.metadata) {
                    return false
                }
                return this.metadata.globalGridId && !!this.grids.filter(g => g.id === this.metadata.globalGridId)[0];
            },
            filteredGrids: function () {
                if (!this.grids) {
                    return [];
                }
                return this.grids.filter(grid => {
                    if (grid.id === this.metadata.globalGridId) {
                        return false;
                    }
                    return grid.label ? grid.label.toLowerCase().includes(this.searchText.toLowerCase()) : false;
                })
            },
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, () => {
                let id = thiz.selectedGraphElement ? thiz.selectedGraphElement.grid.id : null;
                thiz.reload(id);
            });
            progressService.register(text => {
                thiz.progressText = text;
            });
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            thiz.reload().then(() => {
                initContextmenu();
                i18nService.initDomI18n();
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
                name: "Clear all and import from file // Alles löschen und aus Datei importieren",
                icon: "fas fa-file-import"
            },
            SEP2: "---------"
        };

        var itemsMoreMenu = {
            CONTEXT_NEW: {name: "New grid // Neues Grid", icon: "fas fa-plus"},
            SEP1: "---------",
            CONTEXT_EXPORT: {
                name: "Export backup to file // Backup als Datei exportieren",
                icon: "fas fa-file-export"
            },
            CONTEXT_IMPORT: {
                name: "Import grid(s) from file // Grid(s) aus Datei importieren",
                icon: "fas fa-file-import"
            },
            CONTEXT_IMPORT_BACKUP: {
                name: "Clear all and import from file // Alles löschen und aus Datei importieren",
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

    #globalGridActions button {
        width: 30%;
        padding: 0 1vh;
        margin: 0.5vh 0.5vw;
    }

    #globalGridActions {
        display: flex;
    }

    .all-grids-view a {
        font-size: 1.2em;
    }

    .action-buttons button {
        width: 17.5%;
        margin-right: 0.5em;
        padding: 0 20px;
    }

    /* Smaller than tablet */
    @media (max-width: 850px) {
        .all-grids-view a {
            font-size: 1.3em;
            margin-top: 1.5em;
        }

        #globalGridActions button {
            display: block;
            width: 100%;
            padding: 0 1vh;
            margin: 0.5vh 0.5vw;
        }

        #globalGridActions {
            display: block;
            padding-right: 1.5em;
        }

        .action-buttons button {
            padding: 0;
            margin-right: 2%;
        }
    }
</style>