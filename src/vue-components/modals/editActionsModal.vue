<template>
    <div class="modal">
        <div class="modal-mask" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" @keyup.ctrl.right="editNext()" @keyup.ctrl.left="editNext(true)">
            <div class="modal-wrapper">
                <div class="modal-container" v-if="gridElement">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            <span data-i18n>Edit actions // Aktionen bearbeiten</span> <span>("{{gridElement.label}}")</span>
                            <img class="spaced" v-if="gridElement.image" id="imgPreview" :src="gridElement.image.data" style="max-height: 1.5em; margin-bottom: -0.3em;"/>
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label class="three columns" data-i18n="">New Action // Neue Aktion</label>
                            <select id="selectActionType" v-focus="" class="four columns" v-model="selectedNewAction" style="margin-bottom: 0.5em">
                                <option v-for="type in actionTypes" :value="type.getModelName()">{{type.getModelName() | translate}}</option>
                            </select>
                            <button class="four columns" @click="addAction()"><i class="fas fa-plus"/> <span data-i18n="">Add action // Aktion hinzufügen</span></button>
                        </div>
                        <div class="row">
                            <label for="actionList" class="twelve columns" data-i18n="" style="margin-top: 1em; font-size: 1.2em">Current actions // Aktuelle Aktionen</label>
                        </div>
                        <ul id="actionList">
                            <span v-show="gridElement.actions.length == 0" class="row" data-i18n="">
                                <span>No actions defined, click on '<i class="fas fa-plus"/> <span class="hide-mobile">Add action</span>' to add one.</span>
                                <span>Keine Aktionen definiert, klicken Sie auf "<i class="fas fa-plus"/> <span class="hide-mobile">Aktion hinzufügen</span>" um eine Aktion zu definieren.</span>
                            </span>
                            <li v-for="action in gridElement.actions" class="row">
                                <div v-show="editActionId != action.id">
                                    <div class="four columns">
                                        {{action.modelName | translate}}
                                    </div>
                                    <div class="eight columns">
                                        <button @click="editAction(action)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span></button>
                                        <button @click="deleteAction(action)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                                        <button v-if="action.modelName != 'GridActionNavigate'" @click="testAction(action)"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                    </div>
                                </div>
                                <div v-if="editActionId == action.id">
                                    <div class>
                                        <b>{{action.modelName | translate}}</b>
                                    </div>
                                    <div>
                                        <div v-if="action.modelName == 'GridActionSpeak'">
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="selectLang" class="normal-text" data-i18n>Language // Sprache</label>
                                                </div>
                                                <div class="nine columns">
                                                    <select id="selectLang" v-model="action.speakLanguage" style="width: 55%">
                                                        <option v-for="lang in voiceLangs" :value="lang">
                                                            {{lang | translate}}
                                                        </option>
                                                    </select>
                                                    <button @click="testAction(action)" class="inline spaced"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionSpeakCustom'">
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="selectLang2" class="normal-text" data-i18n>Language // Sprache</label>
                                                </div>
                                                <select class="eight columns" id="selectLang2" v-model="action.speakLanguage">
                                                    <option v-for="lang in voiceLangs" :value="lang">
                                                        {{lang | translate}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="inCustomText" class="normal-text" data-i18n>Text to speak // Auszusprechender Text</label>
                                                </div>
                                                <div class="nine columns">
                                                    <input id="inCustomText" type="text" v-model="action.speakText" style="width: 70%"/>
                                                    <button @click="testAction(action)"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionNavigate'">
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="selectGrid" class="normal-text" data-i18n>Grid to navigate // Navigieren zu Grid</label>
                                                </div>
                                                <select class="eight columns" id="selectGrid" type="text" v-model="action.toGridId">
                                                    <option v-for="(label, id) in gridLabels" :value="id">
                                                        {{label}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionARE'">
                                            <edit-are-action :action="action" :grid-data="gridData" :model-file="additionalGridFiles[action.id]" :set-grid-file-fn="setAdditionalGridFile" :end-edit-fn="endEditAction"/>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionPredict'">
                                            <div class="row">
                                                <div class="eight columns">
                                                    <input id="chkSuggestOnChange" type="checkbox" v-model="action.suggestOnChange">
                                                    <label for="chkSuggestOnChange" class="normal-text" data-i18n>Refresh suggestions on change // Vorschläge bei Änderung aktualisieren</label>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="comboUseDict" class="normal-text" data-i18n>Dictionary to use // Zu verwendendes Wörterbuch</label>
                                                </div>
                                                <select class="eight columns" id="comboUseDict" type="text" v-model="action.dictionaryId">
                                                    <option v-for="id in dictionaryKeys" :value="id">
                                                        {{id}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button  @click="save()" title="Keyboard: [Ctrl + Enter]">
                                <i class="fas fa-check"/> <span>OK</span>
                            </button>
                            <div class="hide-mobile">
                                <button @click="editNext(true)" :disabled="false" title="Keyboard: [Ctrl + Left]"><i class="fas fa-angle-double-left"/> <span data-i18n>OK, edit previous // OK, voriges bearbeiten</span></button>
                                <button @click="editNext()" :disabled="false" title="Keyboard: [Ctrl + Right]"><span data-i18n>OK, edit next // OK, nächstes bearbeiten</span> <i class="fas fa-angle-double-right"/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {actionService} from './../../js/service/actionService'
    import {speechService} from './../../js/service/speechService'
    import {predictionService} from "../../js/service/predictionService";
    import {I18nModule} from './../../js/i18nModule.js';
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {AdditionalGridFile} from "../../js/model/AdditionalGridFile";
    import EditAreAction from "./editActionsSub/editAREAction.vue";

    export default {
        props: ['editElementIdParam', 'gridData'],
        data: function () {
            return {
                gridElement: null,
                editActionId: null,
                selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
                gridLabels: null,
                actionTypes: GridElement.getActionTypes(),
                voiceLangs: speechService.getVoicesLangs(),
                dictionaryKeys: predictionService.getDictionaryKeys(),
                editElementId: null,
                additionalGridFiles: {} //map: key = action.id, value = AdditionalGridFile (ARE Model)
            }
        },
        components: {
            EditAreAction
        },
        methods: {
            deleteAction (action) {
                this.setAdditionalGridFile(action, null);
                this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
            },
            editAction (action) {
                var thiz = this;
                thiz.editActionId = action.id;
            },
            endEditAction () {
                this.editActionId = null;
            },
            testAction (action) {
                let props = this.additionalGridFiles[action.id] ? {additionalFiles: [this.additionalGridFiles[action.id]]} : {};
                actionService.testAction(this.gridElement, action, new GridData(props, this.gridData));
            },
            addAction () {
                let thiz = this;
                let newAction = JSON.parse(JSON.stringify(GridElement.getActionInstance(this.selectedNewAction)));
                if(newAction.modelName === GridActionNavigate.getModelName()) {
                    newAction.toGridId = Object.keys(this.gridLabels)[0];
                }
                thiz.gridElement.actions.push(newAction);
                thiz.editActionId = newAction.id;
            },
            setAdditionalGridFile(action, file) {
                if(file) {
                    this.additionalGridFiles[action.id] = file;
                } else {
                    delete this.additionalGridFiles[action.id];
                }
            },
            save () {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    thiz.$emit('close');
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection);
                    thiz.initInternal();
                    $('#selectActionType').focus();
                });
            },
            saveInternal() {
                var thiz = this;
                return new Promise(resolve => {
                    dataService.updateOrAddGridElement(thiz.gridData.id, thiz.gridElement).then(() => {
                        dataService.saveAdditionalGridFiles(thiz.gridData.id, Object.values(thiz.additionalGridFiles)).then(() => {
                            resolve();
                        });
                    });
                });
            },
            initInternal() {
                var thiz = this;
                dataService.getGridElement(thiz.gridData.id, this.editElementId).then(gridElem => {
                    log.debug('editing actions for element: ' + gridElem.label);
                    thiz.gridElement = JSON.parse(JSON.stringify(gridElem));
                });
                dataService.getGridsAttribute('label').then(map => {
                    thiz.gridLabels = map;
                })
            }
        },
        mounted () {
            this.editElementId = this.editElementIdParam;
            this.initInternal();
        },
        updated() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }

    ul li {
        list-style: none;
        outline: 1px solid lightgray;
        padding: 0.5em;
    }

    [v-cloak] {
        display: none !important;
    }

    .normal-text {
        font-weight: normal;
    }
</style>