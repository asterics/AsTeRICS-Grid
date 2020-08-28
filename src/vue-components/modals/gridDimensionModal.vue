<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" style="max-width: 500px">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Set grid size // Grid-Größe anpassen
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label for="gridRows" data-i18n="" class="seven columns">Number of rows // Anzahl der Zeilen</label>
                            <input id="gridRows" type="number" class="three columns" v-model.number="gridData.rowCount" min="1" max="100"/>
                        </div>
                        <div class="row">
                            <label for="gridCols" data-i18n="" class="seven columns">Minimum number of columns // Minimale Anzahl der Spalten</label>
                            <input id="gridCols" type="number" class="three columns" v-model.number="gridData.minColumnCount" min="1" max="100"/>
                        </div>
                        <div class="row" v-if="isGlobalGrid && metadata && gridHeight === 1">
                            <label for="metadataHeight" data-i18n="" class="seven columns">Height of first global grid row [%] // Höhe der ersten Zeile des globalen Grids [%]</label>
                            <input id="metadataHeight" type="number" class="three columns" v-model.number="metadata.globalGridHeightPercentage" min="5" max="50"/>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button @click="$emit('close')" title="Keyboard: [Esc]" class="six columns">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" title="Keyboard: [Ctrl + Enter]" class="six columns">
                                <i class="fas fa-check"/> <span>OK</span>
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
                    setTimeout(() => i18nService.initDomI18n(), 10);
                });
            }
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>