<template>
    <modal :title="$t('exportGridsToPdfGrids')">
        <template #default>
            <div class="srow">
                <label class="two columns" for="selectGrid">{{ $t('selectGrid') }}</label>
                <select class="four columns" id="selectGrid" v-model="selectedGrid" @change="selectedGridChanged">
                    <option :value="null">{{ $t('allGrids') }}</option>
                    <option v-for="elem in graphList" :value="elem.grid">{{elem.grid.label | extractTranslation}}</option>
                </select>
                <div class="four columns">
                    <img v-if="selectedGrid && selectedGrid.thumbnail" :src="selectedGrid.thumbnail.data">
                </div>
            </div>
            <div class="srow" v-show="selectedGrid && allChildren && allChildren.length > 0">
                <input id="exportConnected" type="checkbox" v-model="options.exportConnected"/>
                <label for="exportConnected" >
                    <span>{{ $t('exportAllChildGrids') }}</span>
                    <span>({{allChildren ? allChildren.length : 0}} <span>{{ $t('grids') }}</span>)</span>
                </label>
            </div>
            <div class="srow">
                <input id="showLinks" type="checkbox" v-model="options.showLinks"/>
                <label for="showLinks">{{ $t('insertLinksBetweenPages') }}</label>
            </div>
            <div class="srow">
                <input id="printBackground" type="checkbox" v-model="options.printBackground"/>
                <label for="printBackground">{{ $t('printBackgroundColor') }}</label>
            </div>
            <div class="srow">
                <input id="showRegister" type="checkbox" v-model="options.showRegister"/>
                <label for="showRegister">{{ $t('printIndexAtSideEdge') }}</label>
            </div>
            <div class="srow">
                <input id="includeGlobalGrid" type="checkbox" v-model="options.includeGlobalGrid"/>
                <label for="includeGlobalGrid">{{ $t('includeGlobalGrid') }}</label>
            </div>
        </template>
        <template #ok-button>
            <button
                @click="save"
                @keydown.ctrl.enter="save"
                :aria-label="$t('downloadPdf')"
                :title="$t('keyboardCtrlEnter')"
                >
                    <i class="fas fa-check" aria-hidden="true"></i>
                    {{ $t('downloadPdf') }}
            </button>
        </template>
    </modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import { modalMixin } from '../mixins/modalMixin.js';
    import {dataService} from "../../js/service/data/dataService";
    import {gridUtil} from "../../js/util/gridUtil";
    import {printService} from "../../js/service/printService";
    import {MainVue} from "../../js/vue/mainVue";

    export default {
        mixins: [modalMixin],
        data: function () {
            return {
                selectedGrid: null,
                globalGridId: null,
                graphList: [],
                allChildren: null,
                options: {
                    exportConnected: true,
                    printBackground: false,
                    showLinks: true,
                    showRegister: false,
                    includeGlobalGrid: true
                }
            }
        },
        watch: {
            printGridId(id) {
                this.selectedGrid = id ? this.gridsData.filter(grid => grid.id === id)[0] : null;
                this.options.exportConnected = false;
                this.options.showLinks = false;
                this.selectedGridChanged();
            }
        },
        computed: {
            gridsData() {
                return this.$store.state.grids;
            },
            printGridId() {
                return this.$store.state.printGridId;
            }
        },
        methods: {
            save() {
                let exportGrids = null;
                if (!this.selectedGrid) {
                    exportGrids = this.graphList.map(elem => elem.grid);
                } else {
                    exportGrids = this.options.exportConnected ? [this.selectedGrid].concat(this.allChildren) : [this.selectedGrid];
                }
                let exportIds = exportGrids.map(grid => grid.id);
                Promise.resolve().then(async () => {
                    if (exportGrids.length > this.gridsData.length / 2) {
                        return dataService.getGrids(true, true);
                    } else {
                        let grids = [];
                        for (let i = 0; i < exportIds.length; i++) {
                            let fullGrid = await dataService.getGrid(exportIds[i]);
                            grids.push(fullGrid);
                        }
                        return Promise.resolve(grids);
                    }
                }).then((grids) => {
                    grids = exportIds.map(id => grids.filter(grid => grid.id === id)[0]);
                    printService.gridsToPdf(grids, {
                        printBackground: this.options.printBackground,
                        showLinks: this.options.showLinks,
                        showRegister: this.options.showRegister,
                        includeGlobalGrid: this.options.includeGlobalGrid,
                        progressFn: (progress, text, abortFn) => {
                            MainVue.showProgressBar(progress, {
                                header: i18nService.t('creatingPDFFile'),
                                text: text,
                                cancelFn: abortFn,
                                closable: true
                            })
                        }
                    });
                    this.$store.commit("setPrintGridId", null);
                    this.$emit('close');
                });
            },
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.$store.commit("setPrintGridId", this.selectedGrid.id);
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            }
        },
        mounted() {
            dataService.getGlobalGrid().then(globalGrid => {
                this.globalGridId = globalGrid ? globalGrid.id : null;
                this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId);
                if (this.printGridId) {
                    this.selectedGrid = this.gridsData.filter(grid => grid.id === this.printGridId)[0];
                    this.options.exportConnected = false;
                    this.options.showLinks = false;
                    this.selectedGridChanged();
                }
            });
        },
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }
</style>