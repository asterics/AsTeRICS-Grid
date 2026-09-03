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
                        <div class="srow">
                            <input id="addImages" type="checkbox" v-model="addImages">
                            <label for="addImages">{{ $t('automaticallyAddImages') }}</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="four columns" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="parsedElems.length == 0">
                                <i v-if="!loading" class="fas fa-check"/>
                                <i v-if="loading" class="fas fa-spinner fa-spin"/>
                                <span>{{ $t('insertElements') }}</span>
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
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import { gridUtil } from '../../js/util/gridUtil';
    import { util } from '../../js/util/util';
    import { arasaacService } from '../../js/service/pictograms/arasaacService';

    export default {
        props: ['gridData', 'undoService'],
        data: function () {
            return {
                inputText: "",
                parsedElems: [],
                loading: false,
                addImages: true
            }
        },
        methods: {
            textChanged() {
                let text = this.inputText || '';
                if (util.isOnlyEmojis(text)) {
                    this.parsedElems = util.getEmojis(text);
                } else {
                    text = text.replace(/\n/gi, ';').replace(/;;/gi, ';');
                    this.parsedElems = text.split(';').map(el => el.trim()).filter(el => el.length > 0);
                }
            },
            async save () {
                var thiz = this;
                this.loading = true;
                this.$nextTick(async () => {
                    if (thiz.parsedElems.length === 0) return;
                    let gridDataObject = new GridData(this.gridData);
                    let freeCoordinates = gridUtil.getFreeCoordinates(this.gridData);
                    for (let label of this.parsedElems) {
                        if (freeCoordinates.length === 0) {
                            freeCoordinates = gridUtil.getFreeCoordinates(gridDataObject);
                        }
                        let position = freeCoordinates.shift();
                        if (!position) {
                            position = {
                                x: 0,
                                y: gridUtil.getHeightWithBounds(this.gridData)
                            };
                        }
                        let newElem = new GridElement({
                            label: i18nService.getTranslationObject(label),
                            x: position.x,
                            y: position.y,
                        });
                        if (thiz.addImages) {
                            let results = await arasaacService.query(label);
                            if (results.length > 0) {
                                newElem.image = results[0];
                            }
                        }
                        gridDataObject.gridElements.push(newElem);
                    }
                    await this.undoService.updateGrid(gridDataObject);
                    this.loading = false;
                    this.$emit('reload', gridDataObject);
                    this.$emit('close');
                });
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