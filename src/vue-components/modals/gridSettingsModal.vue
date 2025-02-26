<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" style="max-width: 500px">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('gridSettings') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <h2>{{ $t('size') }}</h2>
                        <div class="srow">
                            <label for="gridRows" class="seven columns">{{ $t('minimumNumberOfRows') }}</label>
                            <input id="gridRows" type="number" class="three columns" v-model.number="gridData.rowCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                        </div>
                        <div class="srow">
                            <label for="gridCols" class="seven columns">{{ $t('minimumNumberOfColumns') }}</label>
                            <input id="gridCols" type="number" class="three columns" v-model.number="gridData.minColumnCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                        </div>
                        <div class="srow" v-if="isGlobalGrid && metadata && gridHeight === 1">
                            <label for="metadataHeight" class="seven columns">{{ $t('heightOfFirstGlobalGridRow') }}</label>
                            <input id="metadataHeight" type="number" class="three columns" v-model.number="metadata.globalGridHeightPercentage" min="5" max="50"/>
                        </div>
                        <div v-if="!isGlobalGrid">
                            <h2>{{ $t('globalGrid') }}</h2>
                            <div class="srow">
                                <input id="showGlobalGrid" type="checkbox" v-model="gridData.showGlobalGrid"/>
                                <label for="showGlobalGrid">{{ $t('showGlobalGrid') }}</label>
                            </div>
                            <div class="srow" v-if="false">
                                <label class="three columns" for="selectGlobalGrid">{{ $t('selectGlobalGrid') }}</label>
                                <select class="seven columns" id="selectGlobalGrid" v-model="gridData.globalGridId">
                                    <option :value="null">({{ $t('defaultGlobalGrid') }})</option>
                                    <option v-for="grid in allGrids" :value="grid.id">{{grid.label | extractTranslation}}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button @click="$emit('close')" :title="$t('keyboardEsc')" class="six columns">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" :title="$t('keyboardCtrlEnter')" class="six columns">
                                <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {dataService} from "../../js/service/data/dataService";
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';
    import { gridUtil } from '../../js/util/gridUtil';
    import { i18nService } from '../../js/service/i18nService';

    export default {
        props: ['gridDataParam', 'isGlobalGrid', 'undoService'],
        data: function () {
            return {
                gridData: JSON.parse(JSON.stringify(this.gridDataParam)),
                gridHeight: gridUtil.getHeight(this.gridDataParam),
                metadata: null,
                allGrids: [],
                gridLayoutUtil: gridLayoutUtil
            }
        },
        methods: {
            save() {
                this.gridData.rowCount = Math.min(this.gridData.rowCount, gridLayoutUtil.MAX_GRID_SIZE);
                this.gridData.minColumnCount = Math.min(this.gridData.minColumnCount, gridLayoutUtil.MAX_GRID_SIZE);
                localStorageService.saveLastGridDimensions({
                    rowCount: this.gridData.rowCount,
                    minColumnCount: this.gridData.minColumnCount
                });
                let promises = [];
                if (this.metadata) {
                    promises.push(dataService.saveMetadata(this.metadata));
                }
                promises.push(this.undoService.updateGrid(this.gridData));
                Promise.all(promises).then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            }
        },
        async mounted() {
            if (this.isGlobalGrid) {
                dataService.getMetadata().then(metadata => {
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                });
            }
            this.allGrids = (await dataService.getGrids(false))
                .sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    h2 {
        margin-top: 2em;
    }
</style>