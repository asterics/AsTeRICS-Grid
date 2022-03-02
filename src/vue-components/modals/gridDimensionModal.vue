<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" style="max-width: 500px">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('setGridSize') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label for="gridRows" class="seven columns">{{ $t('numberOfRows') }}</label>
                            <input id="gridRows" type="number" class="three columns" v-model.number="gridData.rowCount" min="1" max="100"/>
                        </div>
                        <div class="row">
                            <label for="gridCols" class="seven columns">{{ $t('minimumNumberOfColumns') }}</label>
                            <input id="gridCols" type="number" class="three columns" v-model.number="gridData.minColumnCount" min="1" max="100"/>
                        </div>
                        <div class="row" v-if="isGlobalGrid && metadata && gridHeight === 1">
                            <label for="metadataHeight" class="seven columns">{{ $t('heightOfFirstGlobalGridRow') }}</label>
                            <input id="metadataHeight" type="number" class="three columns" v-model.number="metadata.globalGridHeightPercentage" min="5" max="50"/>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
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
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {dataService} from "../../js/service/data/dataService";
    import {GridData} from "../../js/model/GridData";

    export default {
        props: ['gridDataParam', 'isGlobalGrid'],
        data: function () {
            return {
                gridData: JSON.parse(JSON.stringify(this.gridDataParam)),
                gridHeight: new GridData(this.gridDataParam).getHeight(),
                metadata: null
            }
        },
        methods: {
            save() {
                localStorageService.saveLastGridDimensions({
                    rowCount: this.gridData.rowCount,
                    minColumnCount: this.gridData.minColumnCount
                });
                let promises = [];
                if (this.metadata) {
                    promises.push(dataService.saveMetadata(this.metadata));
                }
                Promise.all(promises).then(() => {
                    this.$emit('save', this.gridData.rowCount, this.gridData.minColumnCount);
                    this.$emit('close');
                });
            }
        },
        mounted() {
            if (this.isGlobalGrid) {
                dataService.getMetadata().then(metadata => {
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                });
            }
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>