<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('addMultipleGridItems') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label class="three columns" for="inputText">{{ $t('input') }}</label>
                            <span class="nine columns">{{ $t('insertLabelsForNewElements') }}</span>
                        </div>
                        <div class="row">
                            <textarea v-focus class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;min-height: 70px;" placeholder="Element1;Element2;Element3;..."/>
                        </div>
                        <div class="row">
                            <label class="three columns">{{ $t('recognizedElements') }}</label>
                            <div v-show="parsedElems.length > 0" class="nine columns">
                                <span>{{parsedElems.length}}</span>
                                <span>{{ $t('elementsBracket') }}</span>
                                <span class="break-word">{{JSON.stringify(parsedElems)}}</span>
                            </div>
                            <div v-show="parsedElems.length == 0" class="nine columns">
                                <span>{{ $t('noElements') }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="four columns" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="parsedElems.length == 0">
                                <i class="fas fa-check"/> <span>{{ $t('insertElements') }}</span>
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