<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Edit YouTube player // YouTube Player bearbeiten
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <input v-if="editElement" id="preventClick" type="checkbox" v-model="editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]"/>
                            <label for="preventClick" data-i18n="">Prevent mouse click on YouTube player // Mausklick auf YouTube Player verhindern</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button @click="$emit('close')" title="Keyboard: [Esc]" class="four columns offset-by-four">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" title="Keyboard: [Ctrl + Enter]" class="four columns">
                                <i class="fas fa-check"/> <span data-i18n>Save // Speichern</span>
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
    import {GridElement} from "../../js/model/GridElement.js";
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService.js";
    import {gridUtil} from "../../js/util/gridUtil.js";

    export default {
        props: ['gridData', 'editElementId'],
        data: function () {
            return {
                editElement: null,
                GridElement: GridElement
            }
        },
        methods: {
            save() {
                let grid = gridUtil.updateOrAddGridElement(this.gridData, this.editElement);
                dataService.saveGrid(grid).then(() => {
                    this.$emit('close');
                    this.$emit('reload');
                });
            }
        },
        mounted() {
            i18nService.initDomI18n();
            this.editElement = JSON.parse(JSON.stringify(this.gridData.gridElements.filter(e => e.id === this.editElementId)[0]));
            this.editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
            log.info(JSON.stringify(this.editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]));
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>