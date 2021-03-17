<template>
    <div class="all-grids-view overflow-content box">
        <header class="row header" role="banner">
            <header-icon></header-icon>
            <button tabindex="32" id="moreButton" title="More" class="small"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile" data-i18n>More // Mehr</span></button>
            <button tabindex="31" @click="addGrid()" class="spaced hide-mobile small"><i class="fas fa-plus"/> <span data-i18n="">New Grid // Neues Grid</span></button>
            <div style="display: none">
                <input type="file" id="inputFile" @change="importFromFile" accept=".grd, .obf, .obz"/>
                <input type="file" id="inputFileBackup" @change="importBackupFromFile" accept=".grd, .obz"/>
            </div>
        </header>
        <div class="row content text-content">
            <div v-show="showLoading || grids === null" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative; margin-top: 30vh; top: 0"/>
            </div>

            <div v-if="selectedGraphElement">
                <h1>{{headerDetails}}</h1>
                <div class="row">
                    <div class="five columns">
                        <img :src="selectedGraphElement.grid.thumbnail ? selectedGraphElement.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%; border: 1px solid lightgray"/>
                    </div>
                    <div class="five columns" style="margin-bottom: 1.5em">
                        <label for="gridName" data-i18n="" style="display: block">Name of grid // Grid-Name</label>
                        <input id="gridName" type="text" v-model="newLabel[currentLanguage]" maxlength="25" style="width: 77%"/>
                        <button @click="saveGridLabel" :disabled="isLabelDuplicate(newLabel[currentLanguage])" :title="i18nService.translate('Save name // Name speichern')" style="width: 17%; padding: 0 1%"><i class="fas fa-check"/></button>
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
                        <button @click="deleteGrid(selectedGraphElement.grid.id)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                        <button @click="exportToFile(selectedGraphElement.grid.id)"><i class="fas fa-file-export"/> <span class="hide-mobile" data-i18n="">Export // Exportieren</span></button>
                        <button @click="exportToPdf(selectedGraphElement.grid.id)"><i class="far fa-file-pdf"/> <span class="hide-mobile" data-i18n="">Save as PDF // Als PDF speichern</span></button>
                    </div>
                </div>
            </div>

            <h1 data-i18n="">Grid list // Grid-Liste</h1>
            <div class="row" v-show="graphList.length > 0" style="margin-bottom: 1.5em">
                <label for="selectMode" class="three columns" data-i18n="">Grids to show // Anzuzeigende Grids</label>
                <select id="selectMode" class="four columns" v-model="selectValue" @change="reinitContextMenu">
                    <option :value="selectValues.ALL_GRIDS" data-i18n="">All grids // Alle Grids</option>
                    <option :value="selectValues.CONNECTED_GRIDS" v-if="selectedGraphElement">{{connectedGridsOptionLabel}}</option>
                    <option :value="selectValues.NOT_REACHABLE_GRIDS" data-i18n="" >Not reachable grids // Nicht erreichbare Grids</option>
                </select>
                <span class="three columns">{{graphElemsToShow.length}} <span data-i18n="">elements // Elemente</span></span>
            </div>
            <div class="row">
                <ul>
                    <li v-for="elem in graphElemsToShow" style="display: inline-block; margin-right: 2em; margin-bottom: 1.5em; position: relative">
                        <a href="javascript:;" @click="setSelectedGraphElement(elem)" style="text-decoration: none;">
                            <div style="width: 100%; border: 1px solid lightgray">
                                <div>{{elem.grid.label | extractTranslation}}</div>
                                <img :src="elem.grid.thumbnail ? elem.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%;"/>
                            </div>
                        </a>
                        <button class="gridOptions" :data-grid-id="elem.grid.id" :title="i18nService.translate('More // Mehr')" style="position: absolute; bottom: 3px; right: 0; padding: 0 20px; margin: 0"><i class="fas fa-ellipsis-v"></i></button>
                    </li>
                    <li v-show="graphElemsToShow.length === 0"><span data-i18n="">(no grids) // (keine Grids)</span></li>
                </ul>
            </div>

            <div v-if="graphList.length > 0">
                <h1 data-i18n="">Global grid // Globales Grid</h1>
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
            </div>

            <div class="row" style="margin-bottom: 10em"></div>
            <grid-link-modal v-if="linkModal.show" :grid-from-prop="linkModal.gridFrom" :grid-to-prop="linkModal.gridTo" @close="linkModal.show = false" @reload="reload(linkModal.gridFrom.id)"></grid-link-modal>
            <export-pdf-modal v-if="pdfModal.show" :grids-data="grids" @close="pdfModal.show = false"></export-pdf-modal>
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
    import {gridUtil} from "../../js/util/gridUtil";
    import Accordion from "../components/accordion.vue";
    import {imageUtil} from "../../js/util/imageUtil";
    import GridLinkModal from "../modals/gridLinkModal.vue";
    import ExportPdfModal from "../modals/exportPdfModal.vue";
    import {printService} from "../../js/service/printService";
    import {MainVue} from "../../js/vue/mainVue";

    let SELECTOR_CONTEXTMENU = '#moreButton';

    let vueApp = null;
    let vueConfig = {
        components: {ExportPdfModal, GridLinkModal, Accordion, HeaderIcon},
        data() {
            return {
                metadata: null,
                grids: null,
                graphList: [],
                selectedGraphElement: null,
                newLabel: {},
                showLoading: true,
                selectValues: {
                    CONNECTED_GRIDS: 'CONNECTED_GRIDS',
                    NOT_REACHABLE_GRIDS: 'NOT_REACHABLE_GRIDS',
                    ALL_GRIDS: 'ALL_GRIDS'
                },
                selectValue: null,
                linkModal: {
                    show: false,
                    gridFrom: null,
                    gridTo: null
                },
                pdfModal: {
                    show: false
                },
                i18nService: i18nService,
                currentLanguage: i18nService.getBrowserLang(),
                imageUtil: imageUtil
            };
        },
        methods: {
            setSelectedGraphElement(element, dontScroll) {
                if (!element) return;
                this.selectedGraphElement = element;
                this.newLabel = JSON.parse(JSON.stringify(this.selectedGraphElement.grid.label));
                this.reinitContextMenu();
                this.metadata.lastOpenedGridId = element.grid.id;
                dataService.saveMetadata(this.metadata);
                if (!dontScroll) {
                    $(".all-grids-view").animate({scrollTop: 0}, 200);
                }
            },
            reinitContextMenu() {
                initGridOptions();
                initContextmenu();
            },
            deleteGrid: function (id) {
                log.debug('delete: ' + id);
                let label = i18nService.getTranslation(this.grids.filter(g => g.id === id)[0].label);
                if (!confirm(i18nService.translate('CONFIRM_DELETE_GRID', label))) {
                    return;
                }
                dataService.deleteGrid(id).then(() => {
                    this.reload();
                });
            },
            addGrid: function () {
                var existingNames = this.grids.map(grid => i18nService.getTranslation(grid.label));
                var gridData = new GridData({
                    label: i18nService.getTranslationObject(modelUtil.getNewName('newGrid', existingNames)),
                    gridElements: []
                });
                dataService.saveGrid(gridData).then(() => {
                    return this.reload(gridData.id);
                }).then(() => {
                    $('#gridName').focus();
                });
            },
            isLabelDuplicate: function (label) {
                return !label || this.grids.map(g => i18nService.getTranslation(g.label)).filter(l => l === label).length > 0;
            },
            saveGridLabel() {
                this.selectedGraphElement.grid.label = JSON.parse(JSON.stringify(this.newLabel));
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
            exportToPdf(gridId) {
                dataService.getGrid(gridId).then(grid => {
                    printService.gridsToPdf([grid]);
                })
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
                    thiz.selectedGraphElement = null;
                    thiz.grids = JSON.parse(JSON.stringify(grids)); //hack because otherwise vueJS databinding sometimes does not work;
                    thiz.showLoading = false;
                    thiz.graphList = gridUtil.getGraphList(thiz.grids, thiz.metadata.globalGridId);
                    let gridToOpen = openGridId || thiz.metadata.lastOpenedGridId;
                    thiz.setSelectedGraphElement(thiz.graphList.filter(graphItem => graphItem.grid.id === gridToOpen)[0] || thiz.graphList[0], true);
                    return Promise.resolve();
                });
            },
            onPullUpdate() {
                let id = this.selectedGraphElement ? this.selectedGraphElement.grid.id : null;
                this.reload(id);
            },
            reset() {
                if (confirm(i18nService.translate('CONFIRM_RESET_DB'))) {
                    this.showLoading = true;
                    MainVue.showProgressBar(0, {
                        header: i18nService.translate('Reset to default gridset // Zurücksetzen auf Standard-Gridset'),
                        text: i18nService.translate('Deleting grids // Grids werden gelöscht')
                    });
                    dataService.deleteAllGrids().then(() => {
                        MainVue.showProgressBar(50, {
                            text: i18nService.translate('Importing grids // Grids werden importiert')
                        });
                        return dataService.importDefaultGridset();
                    }).then(() => {
                        MainVue.showProgressBar(100);
                        this.reload();
                    });
                }
            },
            deleteAll() {
                if (confirm(i18nService.translate('Do you really want to delete all grids? This operation cannot be undone! // Möchten Sie wirklich alle Grids löschen? Diese Aktion kann nicht rückgängig gemacht werden!'))) {
                    this.showLoading = true;
                    dataService.deleteAllGrids().then(() => {
                        this.reload();
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
                MainVue.showProgressBar(0, {
                    header: i18nService.translate('Importing grids // Grids werden importiert'),
                    text: i18nService.translate('Reading file // Datei wird gelesen')
                })
                dataService.importGridsFromFile(importFile, reset, (progress, text) => {
                    MainVue.showProgressBar(progress, {
                        text: text
                    });
                }).then(() => {
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
                return this.selectedGraphElement ? i18nService.translate('Details for grid {?} // Details für Grid {?}', `"${i18nService.getTranslation(this.selectedGraphElement.grid.label)}"`) :'';
            },
            connectedGridsOptionLabel: function() {
                return this.selectedGraphElement ? i18nService.translate('Grids connected with "{?}" // Grid verknüpft mit "{?}"', i18nService.getTranslation(this.selectedGraphElement.grid.label)) : '';
            },
            hasGlobalGrid: function() {
                if (!this.grids || !this.metadata) {
                    return false
                }
                return this.metadata.globalGridId && !!this.grids.filter(g => g.id === this.metadata.globalGridId)[0];
            },
            graphElemsToShow: function () {
                if (!this.graphList || !this.selectedGraphElement) {
                    return [];
                }
                switch (this.selectValue) {
                    case this.selectValues.CONNECTED_GRIDS:
                        return this.selectedGraphElement.allRelatives;
                    case this.selectValues.NOT_REACHABLE_GRIDS:
                        return this.graphList.filter(e => e.parents.length === 0);
                    case this.selectValues.ALL_GRIDS:
                        return this.graphList;
                }
            }
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, thiz.onPullUpdate);
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            thiz.selectValue = this.selectValues.ALL_GRIDS;
            thiz.reload().then(() => {
                this.reinitContextMenu();
                i18nService.initDomI18n();
            });
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onPullUpdate);
            $.contextMenu('destroy');
        }
    };

    function initGridOptions() {
        $.contextMenu('destroy');

        let connectVisibleFn = () => vueApp.selectValue !== vueApp.selectValues.CONNECTED_GRIDS;
        let label = vueApp.selectedGraphElement ? i18nService.getTranslation(vueApp.selectedGraphElement.grid.label) : '';
        let optionsMenuItems = {
            CONTEXT_CONNECT: {
                name: i18nService.translate('Connect to grid "{?}" // Verknüpfen mit Grid "{?}"', label),
                icon: "fas fa-external-link-alt",
                visible: connectVisibleFn
            },
            CONTEXT_SHOW: {
                name: "Show // Öffnen",
                icon: "far fa-eye"
            },
            CONTEXT_EDIT: {
                name: "Edit // Bearbeiten",
                icon: "far fa-edit"
            },
            CONTEXT_DUPLICATE: {
                name: "Clone // Duplizieren",
                icon: "far fa-clone"
            },
            CONTEXT_DELETE: {
                name: "Delete // Löschen",
                icon: "far fa-trash-alt"
            },
            CONTEXT_EXPORT: {
                name: "Export // Exportieren",
                icon: "fas fa-file-export"
            },
            CONTEXT_EXPORT_PDF: {
                name: "Save as PDF // Als PDF speichern",
                icon: "far fa-file-pdf"
            }
        };

        $.contextMenu({
            selector: '.gridOptions',
            callback: function (key, options) {
                handleContextMenu(key, options.$trigger.attr('data-grid-id'));
            },
            trigger: 'left',
            items: optionsMenuItems,
            zIndex: 10
        });

        function handleContextMenu(key, gridId) {
            switch (key) {
                case "CONTEXT_CONNECT":
                    vueApp.linkModal.gridFrom = vueApp.selectedGraphElement.grid;
                    vueApp.linkModal.gridTo = vueApp.grids.filter(g => g.id === gridId)[0];
                    vueApp.linkModal.show = true;
                    break;
                case "CONTEXT_SHOW":
                    vueApp.show(gridId);
                    break;
                case "CONTEXT_EDIT":
                    vueApp.edit(gridId);
                    break;
                case "CONTEXT_DUPLICATE":
                    vueApp.clone(gridId);
                    break;
                case "CONTEXT_DELETE":
                    vueApp.deleteGrid(gridId);
                    break;
                case "CONTEXT_EXPORT":
                    vueApp.exportToFile(gridId);
                    break;
                case "CONTEXT_EXPORT_PDF":
                    vueApp.exportToPdf(gridId);
                    break;
            }
        }
    }

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

        var CONTEXT_NEW = "CONTEXT_NEW";
        var CONTEXT_EXPORT = "CONTEXT_EXPORT";
        var CONTEXT_IMPORT = "CONTEXT_IMPORT";
        var CONTEXT_IMPORT_BACKUP = "CONTEXT_IMPORT_BACKUP";
        var CONTEXT_EXPORT_PDF_MODAL = "CONTEXT_EXPORT_PDF_MODAL";
        var CONTEXT_RESET = "CONTEXT_RESET";
        var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

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
            CONTEXT_EXPORT_PDF_MODAL: {
                name: "Save grids to PDF // Grids als PDF speichern",
                icon: "far fa-file-pdf"
            },
            SEP3: "---------",
            //CONTEXT_SUB_IMPORT_EXPORT: {name: "Import / Export", icon: "fas fa-hdd", items: itemsImportExport},
            CONTEXT_DELETE_ALL: {name: "Delete all grids // Alle Grids löschen", icon: "fas fa-trash-alt", disabled: () => vueApp.grids.length === 0},
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
                case CONTEXT_EXPORT_PDF_MODAL: {
                    vueApp.pdfModal.show = true;
                    break;
                }
                case CONTEXT_EXPORT: {
                    vueApp.exportToFile();
                    break;
                }
                case CONTEXT_DELETE_ALL: {
                    vueApp.deleteAll();
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
    h1 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
    }

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
        width: 13.5%;
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