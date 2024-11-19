<template>
    <div class="all-grids-view overflow-content box">
        <div style="display: none">
            <input type="file" id="inputFileBackup" @change="importBackupFromFile" accept=".grd, .obf, .obz, .txt, .json, .zip, application/json, application/zip, application/octet-stream, application/x-zip-compressed, multipart/x-zip"/>
        </div>
        <header-icon full-header="true" v-show="graphList && graphList.length === 0"></header-icon>
        <header class="srow header" role="toolbar" v-show="graphList && graphList.length > 0">
            <header-icon></header-icon>
            <button tabindex="32" id="moreButton" :aria-label="$t('more')" class="small"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile">{{ $t('more') }}</span></button>
            <div id="moreButtonMenu"></div>
            <button tabindex="31" @click="addGrid()" class="spaced hide-mobile small"><i class="fas fa-plus"/> <span>{{ $t('newGrid') }}</span></button>
        </header>
        <div class="srow content text-content" v-if="showLoading || grids === null">
            <div class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative;"/>
            </div>
        </div>
        <div class="srow content text-content" v-if="graphList && graphList.length > 0  && !showLoading">
            <div v-if="selectedGraphElement">
                <h1>{{headerDetails}}</h1>
                <div class="srow">
                    <div class="five columns">
                        <img :src="selectedGraphElement.grid.thumbnail ? selectedGraphElement.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%; border: 1px solid lightgray"/>
                    </div>
                    <div class="five columns" style="margin-bottom: 1.5em">
                        <label for="gridName" style="display: block">{{ $t('nameOfGrid') }}</label>
                        <input id="gridName" type="text" v-model="newLabel[currentLanguage]" maxlength="25" style="width: 77%"/>
                        <button @click="saveGridLabel" :disabled="isLabelDuplicate(newLabel[currentLanguage])" :title="$t('saveName')" style="width: 17%; padding: 0 1%"><i class="fas fa-check"/></button>
                    </div>
                </div>
                <div class="srow" style="margin-bottom: 0.5em">
                    <label for="actionGroup">{{ $t('actions') }}</label>
                </div>
                <div id="actionGroup" class="action-buttons">
                    <div style="display: flex">
                        <button @click="show(selectedGraphElement.grid.id)" :aria-label="$t('show')"><i class="far fa-eye"/> <span class="hide-mobile">{{ $t('show') }}</span></button>
                        <button @click="edit(selectedGraphElement.grid.id)" :aria-label="$t('edit')"><i class="far fa-edit"/> <span class="hide-mobile">{{ $t('edit') }}</span></button>
                        <button @click="clone(selectedGraphElement.grid.id)" :aria-label="$t('clone')"><i class="far fa-clone"/> <span class="hide-mobile">{{ $t('clone') }}</span></button>
                        <button @click="deleteGrid(selectedGraphElement.grid.id)" :aria-label="$t('delete')"><i class="far fa-trash-alt"/> <span class="hide-mobile">{{ $t('delete') }}</span></button>
                        <button @click="exportCustom(selectedGraphElement.grid.id)" :aria-label="$t('export')"><i class="fas fa-file-export"/> <span class="hide-mobile">{{ $t('export') }}</span></button>
                        <button @click="exportToPdf(selectedGraphElement.grid.id)" :aria-label="$t('saveAsPdf')"><i class="far fa-file-pdf"/> <span class="hide-mobile">{{ $t('saveAsPdf') }}</span></button>
                    </div>
                </div>
            </div>

            <div>
                <h1>{{ $t('gridList') }}</h1>
                <div class="srow" v-show="graphList.length > 0" style="margin-bottom: 1em">
                    <label for="selectMode" class="three columns">{{ $t('gridsToShow') }}</label>
                    <select id="selectMode" class="four columns" v-model="selectValue" @change="reinitContextMenu">
                        <option :value="SELECT_VALUES.ALL_GRIDS">{{ $t('allGrids') }}</option>
                        <option :value="SELECT_VALUES.CONNECTED_GRIDS" v-if="selectedGraphElement">{{connectedGridsOptionLabel}}</option>
                        <option :value="SELECT_VALUES.NOT_REACHABLE_GRIDS" >{{ $t('notReachableGrids') }}</option>
                    </select>
                </div>
                <div class="srow" v-show="graphList.length > 0" style="margin-bottom: 1.5em">
                    <label for="selectOrder" class="three columns">{{ $t('sortGridsBy') }}</label>
                    <select id="selectOrder" class="four columns" v-model="orderValue" @change="orderChanged">
                        <option :value="ORDER_VALUES.ALPHABET">{{ $t('labelAlphabetically') }}</option>
                        <option :value="ORDER_VALUES.CONNECTION_COUNT" v-if="selectedGraphElement">{{ $t('numberOfConnections') }}</option>
                    </select>
                    <span class="three columns">{{graphElemsToShow.length}} <span>{{ $t('elements') }}</span></span>
                </div>
                <div class="srow">
                    <ul>
                        <li v-for="elem in graphElemsToShow" style="display: inline-block; margin-right: 2em; margin-bottom: 1.5em; position: relative">
                            <a href="javascript:;" @click="setSelectedGraphElement(elem)" style="text-decoration: none;">
                                <div style="width: 100%; border: 1px solid lightgray">
                                    <div>{{elem.grid.label | extractTranslation}}</div>
                                    <img :src="elem.grid.thumbnail ? elem.grid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; max-width: 100%;"/>
                                </div>
                            </a>
                            <button class="gridOptions" :data-grid-id="elem.grid.id" :title="$t('more')" style="position: absolute; bottom: 3px; right: 0; padding: 0 20px; margin: 0"><i class="fas fa-ellipsis-v"></i></button>
                        </li>
                        <li v-show="graphElemsToShow.length === 0"><span>{{ $t('noGrids') }}</span></li>
                    </ul>
                </div>
                <div class="srow" v-if="graphList && graphList.length > 0">
                    <button @click="updateAllThumbnails"><span class="fas fa-images"></span> {{ $t('updateAllGridThumbnails') }}</button>
                </div>

                <h1>{{ $t('globalGrid') }}</h1>
                <p>{{ $t('aGlobalGridIsShownWithinEachOtherGridAndCan') }}</p>
                <div class="srow">
                    <label class="three columns" for="globalGridActions">{{ $t('actionsForGlobalGrid') }}</label>
                    <div id="globalGridActions" class="eight columns" v-if="metadata">
                        <button v-show="!metadata.globalGridActive || !hasGlobalGrid" @click="setGlobalGridActive(true)"><i class="fas fa-globe"/> <span>{{ $t('activateGlobalGrid') }}</span></button>
                        <button v-show="metadata.globalGridActive && hasGlobalGrid" @click="setGlobalGridActive(false)"><i class="fas fa-globe"/> <span>{{ $t('deactivateGlobalGrid') }}</span></button>
                        <button :disabled="!metadata.globalGridActive" @click="edit(metadata.globalGridId)"><i class="fas fa-edit"/> <span>{{ $t('editGlobalGrid') }}</span></button>
                        <button :disabled="!metadata.globalGridActive" @click="resetGlobalGrid({confirm: true, reload: true})"><i class="fas fa-undo"/> <span>{{ $t('resetGlobalGridToDefault') }}</span></button>
                    </div>
                </div>
                <h1>{{ $t('homeGrid') }}</h1>
                <div class="srow mb-4">
                    <label class="three columns" for="selectHomeGrid">{{ $t('selectHomeGrid') }}</label>
                    <select class="seven columns" id="selectHomeGrid" v-model="metadata.homeGridId" @change="homeGridChanged">
                        <option :value="null">{{ $t('noneAlwaysOpenLastOpenedGrid') }}</option>
                        <option v-for="elem in graphList" :value="elem.grid.id">{{elem.grid.label | extractTranslation}}</option>
                    </select>
                </div>
                <div class="srow">
                    <input id="toHomeAfterSelect" type="checkbox" v-model="metadata.toHomeAfterSelect" @change="homeGridChanged"/>
                    <label for="toHomeAfterSelect">{{ $t('navigateToHomeGridAfterSelectingAnElement') }}</label>
                </div>
                <h1>{{ $t('advancedOptions') }}</h1>
                <div class="srow">
                    <button @click="deleteImages()"><i class="fas fa-times"/> {{ $t('deleteAllImages') }}</button>
                </div>
            </div>
        </div>

        <no-grids-page v-if="graphList && graphList.length === 0 && !showLoading" :restore-backup-handler="importBackup" :import-custom-handler="() => importModal.show = true" :reset-global-grid="this.resetGlobalGrid"></no-grids-page>
        <component v-if="currentModal" :is="currentModal" ref="modal" @reload="handleModalReload" @close="handleModalClose"></component>
        <export-pdf-modal v-if="pdfModal.show" :grids-data="grids" :print-grid-id="pdfModal.printGridId" @close="pdfModal.show = false; pdfModal.printGridId = null;"></export-pdf-modal>
        <export-modal v-if="backupModal.show" :grids-data="grids" :export-options="backupModal.exportOptions" @close="backupModal.show = false"></export-modal>
        <import-modal v-if="importModal.show" @close="importModal.show = false" :reload-fn="reload"></import-modal>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
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
    import { modalDisplayMixin } from '../mixins/modalDisplayMixin.js';
    import GridLinkModal from "../modals/gridLinkModal.vue";
    import ExportPdfModal from "../modals/exportPdfModal.vue";
    import {MainVue} from "../../js/vue/mainVue";
    import {MetaData} from "../../js/model/MetaData.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";
    import {util} from "../../js/util/util.js";
    import ExportModal from "../modals/exportModal.vue";
    import ImportModal from "../modals/importModal.vue";
    import NoGridsPage from "../components/noGridsPage.vue";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate.js";
    import { urlParamService } from '../../js/service/urlParamService';
    import { GridImage } from '../../js/model/GridImage';

    let ORDER_MODE_KEY = "AG_ALLGRIDS_ORDER_MODE_KEY";
    let SELECTOR_CONTEXTMENU = '#moreButton';
    let SELECT_VALUES = {
        CONNECTED_GRIDS: 'CONNECTED_GRIDS',
        NOT_REACHABLE_GRIDS: 'NOT_REACHABLE_GRIDS',
        ALL_GRIDS: 'ALL_GRIDS'
    };
    let ORDER_VALUES = {
        ALPHABET: 'ALPHABET',
        CONNECTION_COUNT: 'CONNECTION_COUNT'
    };

    let vueApp = null;
    let vueConfig = {
        components: {
            NoGridsPage, ImportModal, ExportModal, ExportPdfModal, GridLinkModal, Accordion, HeaderIcon},
        mixins: [modalDisplayMixin],
        data() {
            return {
                metadata: null,
                grids: null,
                graphList: [],
                selectedGraphElement: null,
                newLabel: {},
                showLoading: true,
                SELECT_VALUES: SELECT_VALUES,
                ORDER_VALUES: ORDER_VALUES,
                selectValue: null,
                orderValue: localStorageService.get(ORDER_MODE_KEY) || ORDER_VALUES.CONNECTION_COUNT,
                pdfModal: {
                    show: false,
                    printGridId: null
                },
                backupModal: {
                    show: false,
                    exportOptions: {}
                },
                importModal: {
                    show: false
                },
                i18nService: i18nService,
                currentLanguage: i18nService.getContentLang(),
                imageUtil: imageUtil
            };
        },
        methods: {
            importBackup() {
                document.getElementById('inputFileBackup').click();
            },
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
            orderChanged() {
                localStorageService.save(ORDER_MODE_KEY, this.orderValue);
                this.reinitContextMenu();
            },
            deleteGrid: function (id) {
                log.debug('delete: ' + id);
                let label = i18nService.getTranslation(this.grids.filter(g => g.id === id)[0].label);
                if (!confirm(i18nService.t('CONFIRM_DELETE_GRID', label))) {
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
            exportBackup() {
                dataService.downloadBackupToFile();
            },
            exportCustom(gridId) {
                if (gridId) {
                    this.backupModal.exportOptions.gridId = gridId;
                    this.backupModal.exportOptions.exportDictionaries = false;
                    this.backupModal.exportOptions.exportUserSettings = false;
                    this.backupModal.exportOptions.exportGlobalGrid = false;
                } else {
                    this.backupModal.exportOptions = {}
                }
                this.backupModal.show = true;
            },
            exportToPdf(gridId) {
                this.pdfModal.printGridId = gridId;
                this.pdfModal.show = true;
            },
            importBackupFromFile: async function (event) {
                let importFile = event && event.target && event.target.files[0] ? event.target.files[0] : null;
                let name = importFile ? importFile.name : '';
                if (!name) {
                    return;
                }
                if (this.grids.length > 0 && !confirm(i18nService.t('CONFIRM_IMPORT_BACKUP', name))) {
                    this.resetFileInput(event);
                    return;
                }
                await dataService.importBackupUploadedFile(importFile, (progress, text) => {
                    MainVue.showProgressBar(progress, {
                        text: text
                    });
                });
                this.resetFileInput(event);
                this.reload();
            },
            handleModalReload() {
                if (this.currentModal === 'GridLinkModal') {
                    this.reload(gridFrom.id)
                }
            },
            reload: function (openGridId) {
                let thiz = this;
                return dataService.getMetadata().then(metadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(metadata));
                    return dataService.getGrids();
                }).then(grids => {

                    /*
                    //test script for examining elements with image data (not links) and finding grids that refer to another one
                    for(let grid of grids) {
                        for (let elem of grid.gridElements) {
                            if(elem.image && elem.image.data) {
                                log.warn(JSON.stringify(grid.label) + " --> " + JSON.stringify(elem.label))
                            }
                            for(let action in elem.actions) {
                                if(action.toGridId === "grid-data-1661934788261-462") {
                                    log.warn("!!!!!!!!!!" + JSON.stringify(grid.label) + " --> " + JSON.stringify(elem.label))
                                }
                            }
                        }
                    }*/

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
            deleteAll() {
                if (confirm(i18nService.t('doYouReallyWantDeleteAllGrids'))) {
                    this.showLoading = true;
                    dataService.deleteAllGrids().then(() => {
                        this.reload();
                    });
                }
            },
            async deleteImages() {
                if (confirm(i18nService.t('doYouReallyWantDeleteAllImages'))) {
                    MainVue.showProgressBar(10, {
                        text: i18nService.t('retrievingGrids')
                    });
                    let allGrids = await dataService.getGrids(true, true);
                    MainVue.showProgressBar(50, {
                        text: i18nService.t('Deleting images and saving grids ...')
                    });
                    for (let grid of allGrids) {
                        for (let element of grid.gridElements) {
                            element.image = new GridImage();
                        }
                    }
                    await dataService.saveGrids(allGrids);
                    MainVue.showProgressBar(100);
                }
            },
            setGlobalGridActive(active) {
                if (!this.hasGlobalGrid) {
                    return this.resetGlobalGrid({reload: true});
                }
                this.metadata.globalGridActive = active;
                dataService.saveMetadata(this.metadata);
            },
            async homeGridChanged() {
                dataService.saveMetadata(this.metadata);
                if (this.metadata.homeGridId) {
                    // change nav action of first global grid element ("home")
                    let globalGrid = await dataService.getGlobalGrid();
                    if (globalGrid) {
                        let navActions = gridUtil.getActionsOfType(globalGrid.gridElements[0], GridActionNavigate.getModelName());
                        if (navActions.length > 0) {
                            navActions[0].navType = GridActionNavigate.NAV_TYPES.TO_HOME;
                            await dataService.saveGrid(globalGrid);
                        }
                    }

                }
            },
            resetGlobalGrid(options) {
                options = options || {};
                if (options.confirm) {
                    if (!confirm(i18nService.t('doYouReallyWantResetGlobalGrid'))) {
                        return;
                    }
                }
                return dataService.getGlobalGrid(true).then(existingGlobal => {
                    return existingGlobal ? dataService.deleteGrid(existingGlobal.id) : Promise.resolve();
                }).then(() => {
                    let globalGrid = gridUtil.generateGlobalGrid(null, {
                        convertToLowercase: options.convertToLowercase
                    });
                    this.metadata.globalGridId = globalGrid.id;
                    this.metadata.globalGridActive = true;
                    this.metadata.globalGridHeightPercentage = new MetaData().globalGridHeightPercentage;
                    return dataService.saveGrid(globalGrid);
                }).then(() => {
                    return dataService.saveMetadata(this.metadata);
                }).then(() => {
                    if (options.reload) {
                        this.reload();
                    }
                    return Promise.resolve();
                });
            },
            resetFileInput(event) {
                var $el = $(event.target); //reset file input
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();
            },
            async updateAllThumbnails() {
                if (!confirm(i18nService.t('updateGridThumbnailsConfirm'))) {
                    return;
                }
                let totalSize = 0;
                let cancelled = false;
                dataService.getGrids(false, true).then(async grids => {
                    let index = 0;
                    MainVue.showProgressBar(0, {
                        header: i18nService.t("updateGridThumbnails"),
                        text: i18nService.t("generatingThumbnails"),
                        closable: true,
                        cancelFn: () => {
                            cancelled = true;
                        }
                    });
                    for (const gridShort of grids) {
                        if (cancelled) {
                            Router.toManageGrids();
                            return;
                        }
                        let loadPromise = new Promise(resolve => {
                            $(document).on(constants.EVENT_GRID_LOADED, resolve);
                        });
                        Router.toGrid(gridShort.id, {skipThumbnailCheck: true});
                        await loadPromise;
                        await util.sleep(100);
                        await updateScreenshot(gridShort.id);
                        if (cancelled) {
                            Router.toManageGrids();
                            return;
                        }
                        index++;
                        MainVue.showProgressBar(Math.round(index / grids.length * 100), {
                            header: i18nService.t("updateGridThumbnails"),
                            text: i18nService.t("generatingThumbnails"),
                            closable: true,
                            cancelFn: () => {
                                cancelled = true;
                            }
                        });
                    }
                    urlParamService.removeParam("skipThumbnailCheck");
                    log.info(`saved all thumbnails with total size of ${totalSize / 1024}kB`);
                    Router.toManageGrids();
                    setTimeout(() => {
                        MainVue.setTooltip(i18nService.t("updatedAllThumbnails"), {timeout: 20000, msgType: "success"});
                    }, 500);
                });

                async function updateScreenshot(gridId) {
                    let grid = await dataService.getGrid(gridId);
                    await imageUtil.allImagesLoaded();
                    let screenshot = await imageUtil.getScreenshot("#grid-container");
                    log.info(`save screenshot for: ${i18nService.getTranslation(grid.label)}, size: ${screenshot.length / 1024}kB`);
                    totalSize += screenshot.length;
                    let thumbnail = {
                        data: screenshot,
                        hash: grid.getHash()
                    };
                    grid.thumbnail = thumbnail;
                    await dataService.updateGrid(grid.id, {
                        thumbnail: thumbnail
                    });
                }
            }
        },
        computed: {
            gridFrom() {
                return this.$store.state.gridFrom;
            },
            headerDetails: function() {
                return this.selectedGraphElement ? i18nService.t('detailsForGridX', `"${i18nService.getTranslation(this.selectedGraphElement.grid.label)}"`) :'';
            },
            connectedGridsOptionLabel: function() {
                return this.selectedGraphElement ? i18nService.t('gridsConnectedWithX', i18nService.getTranslation(this.selectedGraphElement.grid.label)) : '';
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
                let elems = [];
                switch (this.selectValue) {
                    case this.SELECT_VALUES.CONNECTED_GRIDS:
                        elems = this.selectedGraphElement.allRelatives;
                        break;
                    case this.SELECT_VALUES.NOT_REACHABLE_GRIDS:
                        elems = this.graphList.filter(e => e.parents.length === 0 && e.grid.id !== this.metadata.homeGridId);
                        break;
                    case this.SELECT_VALUES.ALL_GRIDS:
                        elems = this.graphList;
                        break;
                }
                switch (this.orderValue) {
                    case this.ORDER_VALUES.ALPHABET:
                        elems = elems.sort((a, b) => i18nService.getTranslation(a.grid.label).localeCompare(i18nService.getTranslation(b.grid.label)));
                        break;
                    case this.ORDER_VALUES.CONNECTION_COUNT:
                        elems = elems = elems.sort((a, b) => b.allRelatives.length - a.allRelatives.length);
                        break;
                }
                return elems;
            }
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, thiz.onPullUpdate);
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            thiz.selectValue = this.SELECT_VALUES.ALL_GRIDS;
            thiz.reload().then(() => {
                this.reinitContextMenu();
            });
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onPullUpdate);
            $.contextMenu('destroy');
        }
    };

    function initGridOptions() {
        $.contextMenu('destroy');

        let connectVisibleFn = () => vueApp.selectValue !== vueApp.SELECT_VALUES.CONNECTED_GRIDS;
        let label = vueApp.selectedGraphElement ? i18nService.getTranslation(vueApp.selectedGraphElement.grid.label) : '';
        let optionsMenuItems = {
            CONTEXT_CONNECT: {
                name: i18nService.t('connectXWithThisGrid', label),
                icon: "fas fa-external-link-alt",
                visible: connectVisibleFn
            },
            CONTEXT_SHOW: {
                name: i18nService.t('show'),
                icon: "far fa-eye"
            },
            CONTEXT_EDIT: {
                name: i18nService.t('edit'),
                icon: "far fa-edit"
            },
            CONTEXT_DUPLICATE: {
                name: i18nService.t('clone'),
                icon: "far fa-clone"
            },
            CONTEXT_DELETE: {
                name: i18nService.t('delete'),
                icon: "far fa-trash-alt"
            },
            CONTEXT_EXPORT: {
                name: i18nService.t('export'),
                icon: "fas fa-file-export"
            },
            CONTEXT_EXPORT_PDF: {
                name: i18nService.t('saveAsPdf'),
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
                    vueApp.$store.commit('setGridFrom', vueApp.selectedGraphElement.grid);
                    vueApp.$store.commit('setGridTo', vueApp.grids.filter(g => g.id === gridId)[0]);
                    vueApp.setModal('GridLinkModal');
                    vueApp.$nextTick(() => {
                        vueApp.$refs.modal.openModal();
                    });
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
                    vueApp.exportCustom(gridId);
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
        var CONTEXT_EXPORT_CUSTOM = "CONTEXT_EXPORT_CUSTOM";
        var CONTEXT_IMPORT = "CONTEXT_IMPORT";
        var CONTEXT_IMPORT_BACKUP = "CONTEXT_IMPORT_BACKUP";
        var CONTEXT_EXPORT_PDF_MODAL = "CONTEXT_EXPORT_PDF_MODAL";
        var CONTEXT_RESET = "CONTEXT_RESET";

        let noGrids = (() => vueApp.grids.length === 0);
        var itemsMoreMenu = {
            CONTEXT_NEW: {name: i18nService.t('newGrid'), icon: "fas fa-plus"},
            SEP1: "---------",
            CONTEXT_EXPORT: {
                name: i18nService.t('exportBackupToFile'),
                icon: "fas fa-download",
                disabled: noGrids
            },
            CONTEXT_EXPORT_CUSTOM: {
                name: i18nService.t('saveCustomDataToFile'),
                icon: "fas fa-file-export",
                disabled: noGrids
            },
            CONTEXT_EXPORT_PDF_MODAL: {
                name: i18nService.t('saveGridsToPdfGrids'),
                icon: "far fa-file-pdf",
                disabled: noGrids
            },
            SEP2: "---------",
            CONTEXT_IMPORT_BACKUP: {
                name: i18nService.t('restoreBackupFromFile'),
                icon: "fas fa-upload"
            },
            CONTEXT_IMPORT: {
                name: i18nService.t('importCustomDataFromFile'),
                icon: "fas fa-file-import"
            },
            SEP3: "---------",
            CONTEXT_RESET: {name: i18nService.t('resetToDefaultConfig'), icon: "fas fa-minus-circle", disabled: noGrids},
        };

        $.contextMenu({
            selector: SELECTOR_CONTEXTMENU,
            appendTo: '#moreButtonMenu',
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
                    vueApp.importModal.show = true;
                    break;
                }
                case CONTEXT_IMPORT_BACKUP: {
                    vueApp.importBackup();
                    break;
                }
                case CONTEXT_EXPORT_PDF_MODAL: {
                    vueApp.pdfModal.show = true;
                    break;
                }
                case CONTEXT_EXPORT: {
                    vueApp.exportBackup();
                    break;
                }
                case CONTEXT_EXPORT_CUSTOM: {
                    vueApp.exportCustom();
                    break;
                }
                case CONTEXT_RESET: {
                    vueApp.deleteAll();
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