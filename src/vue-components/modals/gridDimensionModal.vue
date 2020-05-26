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

                    <div class="modal-body container">
                        <div class="row">
                            <label for="gridRows" data-i18n="" class="six columns">Number of rows // Anzahl der Zeilen</label>
                            <input id="gridRows" type="number" class="three columns" v-model="gridData.rowCount" min="1" max="100"/>
                        </div>
                        <div class="row">
                            <label for="gridCols" data-i18n="" class="six columns">Minimum number of columns // Minimale Anzahl der Spalten</label>
                            <input id="gridCols" type="number" class="three columns" v-model="gridData.minColumnCount" min="1" max="100"/>
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

    export default {
        props: ['gridDataParam'],
        data: function () {
            return {
                gridData: JSON.parse(JSON.stringify(this.gridDataParam))
            }
        },
        methods: {
            save() {
                this.$emit('save', this.gridData.rowCount, this.gridData.minColumnCount);
                this.$emit('close');
            }
        },
        mounted() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>