<template>
    <modal :title="$t('addMultipleGridItems')">
        <template #default>
            <div class="srow">
                <label class="three columns" for="inputText">{{ $t('input') }}</label>
                <span class="nine columns">{{ $t('insertLabelsForNewElements') }}</span>
            </div>
            <div class="srow">
                <textarea v-focus class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;min-height: 70px;" placeholder="Element1;Element2;Element3;..."/>
            </div>
            <div class="srow">
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
        </template>
        <template #ok-button>
            <button
                @click="save"
                @keydown.ctrl.enter="save"
                :aria-label="$t('insertElements')"
                :title="$t('keyboardCtrlEnter')"
                :disabled="parsedElems.length == 0"
                >
                    <i class="fas fa-check" aria-hidden="true"></i>
                    {{ $t('insertElements') }}
            </button>
        </template>
    </modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {i18nService} from "../../js/service/i18nService";
    import { modalMixin } from '../mixins/modalMixin.js';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";

    export default {
        mixins: [modalMixin],
        data: function () {
            return {
                inputText: "",
                parsedElems: []
            }
        },
        computed: {
            gridData() {
                return this.$store.state.gridData;
            },
            gridInstance() {
                return this.$store.state.gridInstance;
            },
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
                this.$emit('save', this.gridInstance);
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
    .srow {
        margin-top: 1em;
    }
</style>