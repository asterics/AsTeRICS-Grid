<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">

                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Add multiple grid items // Mehrere Grid-Elemente hinzufügen
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label class="three columns" for="inputText" data-i18n="">Input // Eingabe</label>
                            <span class="nine columns" data-i18n="">Insert Labels for new elements, separated by ";" or [Enter] // Geben Sie Label für neue Elemente getrennt durch ";" oder [Enter] ein</span>
                        </div>
                        <div class="row">
                            <textarea class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;" placeholder="Element1;Element2;Element3;..."/>
                        </div>
                        <div class="row">
                            <label class="three columns" data-i18n>Recognized Elements // Erkannte Elemente</label>
                            <div v-show="parsedElems.length > 0" class="nine columns">
                                <span>{{parsedElems.length}}</span>
                                <span data-i18n>Element(s) // Element(e)</span>
                                <span style="word-break: break-all;">{{JSON.stringify(parsedElems)}}</span>
                            </div>
                            <div v-show="parsedElems.length == 0" class="nine columns">
                                <span data-i18n>No elements // Keine Elemente</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="u-pull-right" @click="save()" data-i18n="" :disabled="parsedElems.length == 0">
                            Insert elements // Elemente einfügen
                        </button>
                        <button class="u-pull-right spaced" @click="$emit('close')" data-i18n>
                            Cancel // Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from './../js/service/dataService'
    import {I18nModule} from './../js/i18nModule.js';
    import './../css/modal.css';
    import {GridElement} from "../js/model/GridElement";
    import {GridData} from "../js/model/GridData";

    export default {
        props: ['gridData'],
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
                if(this.parsedElems.length > 0) {
                    var newElems = [];
                    var gridDataObject = new GridData(this.gridData);
                    this.parsedElems.forEach(label => {
                        var newElem = new GridElement({
                            label: label,
                            x: gridDataObject.getNewXYPos().x,
                            y: gridDataObject.getNewXYPos().y,
                        });
                        gridDataObject.gridElements.push(newElem);
                        newElems.push(newElem);
                    });
                    dataService.addGridElements(thiz.gridData.id, newElems).then(() => {
                        this.$emit('reload');
                        this.$emit('close');
                    });
                } else {
                    this.$emit('close');
                }
            }
        },
        mounted () {
            var thiz = this;
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>