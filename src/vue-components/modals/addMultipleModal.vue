<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Add multiple grid items // Mehrere Grid-Elemente hinzufügen
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label class="three columns" for="inputText" data-i18n="">Input // Eingabe</label>
                            <span class="nine columns" data-i18n="">Insert Labels for new elements, separated by ";" or [Enter] // Geben Sie Label für neue Elemente getrennt durch ";" oder [Enter] ein</span>
                        </div>
                        <div class="row">
                            <textarea v-focus class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;min-height: 70px;" placeholder="Element1;Element2;Element3;..."/>
                        </div>
                        <div class="row">
                            <label class="three columns" data-i18n>Recognized Elements // Erkannte Elemente</label>
                            <div v-show="parsedElems.length > 0" class="nine columns">
                                <span>{{parsedElems.length}}</span>
                                <span data-i18n>Element(s) // Element(e)</span>
                                <span class="break-word">{{JSON.stringify(parsedElems)}}</span>
                            </div>
                            <div v-show="parsedElems.length == 0" class="nine columns">
                                <span data-i18n>No elements // Keine Elemente</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button class="four columns offset-by-four" @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button class="four columns" @click="save()" title="Keyboard: [Ctrl + Enter]" :disabled="parsedElems.length == 0">
                                <i class="fas fa-check"/> <span data-i18n>Insert elements // Elemente einfügen</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";

    export default {
        props: ['gridData', 'gridInstance'],
        data: function () {
            return {
                inputText: "",
                parsedElems: []
            }
        },
        methods: {
            textChanged() {
                var text = this.inputText || "";
                var text = text.replace(/\n/gi, ';').replace(/;;/gi, ';');
                this.parsedElems = text.split(';').map(el => el.trim()).filter(el => el.length > 0);
            },
            save () {
                var thiz = this;
                if(thiz.parsedElems.length === 0) return;

                var gridDataObject = new GridData(this.gridData);
                this.parsedElems.forEach(label => {
                    var newElem = new GridElement({
                        label: i18nService.getTranslationObject(label),
                        x: gridDataObject.getNewXYPos().x,
                        y: gridDataObject.getNewXYPos().y,
                    });
                    gridDataObject.gridElements.push(newElem);
                });
                this.gridInstance.updateGridWithUndo(gridDataObject);
                this.$emit('close');
            }
        },
        mounted() {
            var thiz = this;
            i18nService.initDomI18n();
            helpService.setHelpLocation('03_appearance_layout', '#adding-elements-and-layout-options');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>