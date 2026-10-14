<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('exportGridsToPdfGrids') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="srow">
                            <label class="two columns" for="pdfExportMode">{{ $t('exportMode') }}</label>
                            <select class="four columns" id="pdfExportMode" v-model="pdfExportMode">
                                <option v-for="mode in pdfService.MODES" :value="mode">{{mode | extractTranslation}}</option>
                            </select>
                        </div>
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
                            <input id="printBackground" type="checkbox" v-model="options.printBackground"/>
                            <label for="printBackground">{{ $t('printBackgroundColor') }}</label>
                        </div>
                        <div v-if="pdfExportMode === pdfService.MODE_NORMAL">
                            <div class="srow">
                                <input id="showLinks" type="checkbox" v-model="options.showLinks"/>
                                <label for="showLinks">{{ $t('insertLinksBetweenPages') }}</label>
                            </div>
                            <div class="srow">
                                <input id="showRegister" type="checkbox" v-model="options.showRegister"/>
                                <label for="showRegister">{{ $t('printIndexAtSideEdge') }}</label>
                            </div>
                            <div class="srow">
                                <input id="includeGlobalGrid" type="checkbox" v-model="options.includeGlobalGrid"/>
                                <label for="includeGlobalGrid">{{ $t('includeGlobalGrid') }}</label>
                            </div>
                        </div>
                        <div v-if="pdfExportMode === pdfService.MODE_RESIZE">
                            <div class="srow">
                                <label class="two columns" for="selectedSize">{{ $t('elementSize') }}</label>
                                <select class="four columns" id="selectedSize" v-model="selectedSize">
                                    <option v-for="option in sizeOptions" :value="option">
                                        {{ formatOption(option) }}
                                    </option>
                                    <option :value="null">{{ $t('customValue') }}</option>
                                </select>
                            </div>
                            <div class="srow" v-if="selectedSize === null">
                                <slider-input id="customElemSize" v-model="customSize" :min="10" :max="192" :label="$t('customValue')" unit="mm" :value-format-fn="formatCustomSizeValue"/>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('downloadPdf') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService";
    import {gridUtil} from "../../js/util/gridUtil";
    import {pdfService} from "../../js/service/pdfExport/pdfService";
    import {MainVue} from "../../js/vue/mainVue";
    import {util} from "../../js/util/util";
    import SliderInput from "./input/sliderInput.vue";

    export default {
        components: {SliderInput},
        props: ['gridsData', 'printGridId', 'metadata'],
        data: function () {
            let sizeOptions = pdfService.getSizeOptions();
            return {
                pdfExportMode: pdfService.MODE_NORMAL,
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
                },
                sizeOptions: sizeOptions,
                selectedSize: sizeOptions[0],
                customSize: 64,
                pdfService: pdfService,
                util: util
            }
        },
        methods: {
            async save() {
                let exportGrids = null;
                let grids = [];
                if (!this.selectedGrid) {
                    exportGrids = this.graphList.map(elem => elem.grid);
                } else {
                    exportGrids = this.options.exportConnected ? [this.selectedGrid].concat(this.allChildren) : [this.selectedGrid];
                }
                let exportIds = exportGrids.map(grid => grid.id);
                if (exportGrids.length > this.gridsData.length / 2) {
                    grids = await dataService.getGrids(true, true);
                } else {
                    for (let i = 0; i < exportIds.length; i++) {
                        let fullGrid = await dataService.getGrid(exportIds[i]);
                        grids.push(fullGrid);
                    }
                }
                grids = exportIds.map(id => grids.find(grid => grid.id === id));
                let progressFn = (progress, text, abortFn) => {
                    MainVue.showProgressBar(progress, {
                        header: i18nService.t('creatingPDFFile'),
                        text: text,
                        cancelFn: abortFn,
                        closable: true
                    })
                };
                if (this.pdfExportMode === pdfService.MODE_NORMAL) {
                    let homeGridId = this.metadata.homeGridId;
                    let selectedId = this.selectedGrid ? this.selectedGrid.id : null;
                    grids = gridUtil.sortGrids(grids, homeGridId, selectedId);
                    pdfService.gridsToPdf(grids, {
                        printBackground: this.options.printBackground,
                        showLinks: this.options.showLinks,
                        showRegister: this.options.showRegister,
                        includeGlobalGrid: this.options.includeGlobalGrid,
                        progressFn: progressFn
                    });
                } else if (this.pdfExportMode === pdfService.MODE_RESIZE) {
                    let elemSize = this.selectedSize ? this.selectedSize.elemSize : this.customSize;
                    pdfService.gridsResizedToPdf(grids, elemSize, {
                        printBackground: this.options.printBackground,
                        progressFn: progressFn
                    });
                }
                this.$emit('close');
            },
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            },
            formatCustomSizeValue(value) {
                let option = pdfService.getSizeOption(value);
                return this.formatOption(option);
            },
            formatOption(option) {
                return `${util.roundTo(option.elemSize, 1)}mm (${option.itemsX} x ${option.itemsY})`;
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
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }
</style>