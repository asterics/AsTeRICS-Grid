<template>
    <base-modal icon="fas fa-expand-arrows-alt" :title="$t('setGridSize')" :help="false" @open="init" @keyup.ctrl.enter="save" @ok="save" v-on="$listeners">
                        <div class="srow" v-if="gridData">
                            <label for="gridRows">{{ $t('numberOfRows') }}</label>
                            <input id="gridRows" type="number" v-model.number="gridData.rowCount" min="1" max="100"/>
                        </div>
                        <div class="srow" v-if="gridData">
                            <label for="gridCols">{{ $t('minimumNumberOfColumns') }}</label>
                            <input id="gridCols" type="number" v-model.number="gridData.minColumnCount" min="1" max="100"/>
                        </div>
                        <div class="srow" v-if="isGlobalGrid && metadata && gridHeight === 1">
                            <label for="metadataHeight">{{ $t('heightOfFirstGlobalGridRow') }}</label>
                            <input id="metadataHeight" type="number" v-model.number="metadata.globalGridHeightPercentage" min="5" max="50"/>
                        </div>
    </base-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {modalMixin} from "../mixins/modalMixin";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {dataService} from "../../js/service/data/dataService";
    import {GridData} from "../../js/model/GridData";

    export default {
        props: ['gridDataParam', 'isGlobalGrid'],
        mixins: [modalMixin],
        data: function () {
            return {
                gridData: null,
                gridHeight: null,
                metadata: null
            }
        },
        methods: {
            save() {
                this.gridData.rowCount = Math.min(this.gridData.rowCount, 100);
                this.gridData.minColumnCount = Math.min(this.gridData.minColumnCount, 100);
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
                    this.closeModal();
                });
            },
        init() {
            this.gridData = JSON.parse(JSON.stringify(this.gridDataParam));
            this.gridHeight = new GridData(this.gridDataParam).getHeight()
            if (this.isGlobalGrid) {
                dataService.getMetadata().then(metadata => {
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                });
            }
        }
        },
    }
</script>

<style lang="scss" scoped>
    .srow {
        margin-top: 1em;
    }
    dialog {
        max-width: 500px;
        
        .srow {
            width: 100%;
            display: flex;
            flex-flow: column nowrap;
            justify-content: space-between;
            align-items: center;

            label, input {
                width: 100%;
            }
        }
    }
    @media screen and (min-width: 768px) {
        dialog {
            .srow {
                flex-flow: row nowrap;
                
                input {
                    width: unset;
                    text-align: right;
                }
            }
        }
    }
</style>