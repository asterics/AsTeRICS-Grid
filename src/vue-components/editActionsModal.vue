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
                                            <div class="row">
                                                <div class="two columns">
                                                    <label for="inputAREURI" class="normal-text">ARE URL</label>
                                                </div>
                                                <div class="nine columns">
                                                    <div class="row">
                                                        <input id="inputAREURI" class="six columns" type="text" v-model="action.areURL"/>
                                                        <div class="six columns">
                                                            <button @click="testAREUrl(action)"><i class="fas fa-bolt"/> <span data-i18n="">Test URL // URL testen</span></button>
                                                            <span class="spaced" v-show="areConnected === undefined"><i class="fas fa-spinner fa-spin"/></span>
                                                            <span class="spaced" v-show="areConnected" style="color: green"><i class="fas fa-check"/></span>
                                                            <span class="spaced" v-show="areConnected == false" style="color: red"><i class="fas fa-times"/></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="two columns">
                                                    <label class="normal-text">ARE Model</label>
                                                </div>
                                                <div class="nine columns">
                                                    <span v-show="loading" data-i18n="">Loading Model from ARE... // Lade Modell von ARE...</span>
                                                    <span v-show="!loading && action.areModel && !action.areModel.modelDataBase64" data-i18n="">Could not load Model from ARE! // Konnte Modell nicht von ARE laden!</span>
                                                    <span v-if="!loading && action.areModel && action.areModel.modelDataBase64">
                                                        <a href="javascript:void(0);" @click="downloadModelFile(action.areModel)">{{action.areModel.areModelName}}</a>
                                                    </span>
                                                    <button @click="reloadAREModel(action)" class="inline spaced"><i class="fas fa-sync-alt"/> <span class="hide-mobile" data-i18n="">Update from ARE // Update von ARE</span></button>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="two columns">
                                                    <label class="normal-text" for="inputComponentId" data-i18n="">Component // Komponente</label>
                                                </div>
                                                <select class="five columns" id="inputComponentId" v-model="action.componentId" @change="componentIdChanged(action.componentId, action)">
                                                    <option v-for="id in areComponentIds" :value="id">
                                                        {{id}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row" v-if="areComponentPorts.length != 0">
                                                <div class="two columns">
                                                    <label for="inputDataPortId" class="normal-text" data-i18n="">
                                                        <span>Send data <span class="show-mobile">to port</span></span>
                                                        <span>Sende Daten <span class="show-mobile">zu Port</span></span>
                                                    </label>
                                                </div>
                                                <div class="five columns">
                                                    <label for="inputDataPortId" class="normal-text hide-mobile">Port</label>
                                                    <select id="inputDataPortId" class="full-width" v-model="action.dataPortId">
                                                        <option v-for="id in areComponentPorts" :value="id">
                                                            {{id}}
                                                        </option>
                                                    </select>
                                                </div>
                                                <div class="five columns">
                                                    <label for="inputDataPortData" class="normal-text" data-i18n="">Data // Daten</label>
                                                    <input id="inputDataPortData" type="text" v-model="action.dataPortSendData"/>
                                                </div>
                                            </div>
                                            <div class="row" v-if="areComponentEventChannels.length != 0">
                                                <div class="two columns">
                                                    <label for="inputeventChannelId" class="normal-text" data-i18n="">
                                                        <span>Trigger event <span class="show-mobile">on event channel</span></span>
                                                        <span>Event triggern <span class="show-mobile">auf Event-Channel</span></span>
                                                    </label>
                                                </div>
                                                <div class="five columns">
                                                    <label for="inputeventChannelId" class="normal-text hide-mobile">Event-Channel</label>
                                                    <select id="inputeventChannelId" class="full-width" v-model="action.eventChannelId">
                                                        <option v-for="id in areComponentEventChannels" :value="id">
                                                            {{id}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="testAction(action)"><i class="fas fa-bolt"/> <span data-i18n="">Test action // Aktion Testen</span></button>
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
    import FileSaver from 'file-saver'
    import {dataService} from './../js/service/dataService'
    import {actionService} from './../js/service/actionService'
    import {speechService} from './../js/service/speechService'
    import {areService} from './../js/service/areService'
    import {I18nModule} from './../js/i18nModule.js';
    import {imageUtil} from './../js/util/imageUtil';
    import {GridActionNavigate} from "../js/model/GridActionNavigate";
    import {GridActionARE} from "../js/model/GridActionARE";
    import './../css/modal.css';
    import {GridElement} from "../js/model/GridElement";
    import {GridData} from "../js/model/GridData";
    import {AREModel} from "../js/model/AREModel";

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
                editElementId: null,
                loading: true,
                areConnected: null,
                areComponentIds: [],
                areComponentPorts: [],
                areComponentEventChannels: []
            }
        },
        methods: {
            deleteAction (action) {
                this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
            },
            editAction (action) {
                this.editActionId = action.id;
            },
            endEditAction () {
                this.editActionId = null;
            },
            testAction (action) {
                actionService.testAction(this.gridElement, action);
            },
            addAction () {
                var thiz = this;
                var newAction = JSON.parse(JSON.stringify(GridElement.getActionInstance(this.selectedNewAction)));
                if(newAction.modelName == GridActionNavigate.getModelName()) {
                    newAction.toGridId = Object.keys(this.gridLabels)[0];
                } else if(newAction.modelName == GridActionARE.getModelName()) {
                    newAction.areURL = areService.getRestURL();
                    thiz.reloadAREModel(newAction);
                }

                thiz.gridElement.actions.push(newAction);
                thiz.editActionId = newAction.id;
            },
            reloadAREModel (action) {
                var thiz = this;
                thiz.loading = true;
                areService.downloadDeployedModelBase64(action.areURL).then(base64Model => {
                    areService.getModelName(action.areURL).then(modelName => {
                        action.areModel.modelDataBase64 = base64Model;
                        action.areModel.areModelName = modelName;
                        thiz.loading = false;
                    });
                }).catch(() => {
                    action.areModel.modelDataBase64 = null;
                    thiz.loading = false;
                });
                areService.getRuntimeComponentIds(action.areURL).then(ids => {
                    thiz.areComponentPorts = [];
                    thiz.areComponentEventChannels = [];
                    action.componentId = null;
                    thiz.areComponentIds = ids;
                });
            },
            testAREUrl(action) {
                var thiz = this;
                action.areURL = areService.getRestURL(action.areURL);
                thiz.areConnected = undefined;
                areService.getModelName(action.areURL).then(() => {
                    thiz.areConnected = true;
                }).catch(() => {
                    thiz.areConnected = false;
                });
            },
            componentIdChanged(newComponentId, action) {
                var thiz = this;
                thiz.areComponentPorts = [];
                thiz.areComponentEventChannels = [];
                if(newComponentId) {
                    areService.getComponentEventChannelIds(newComponentId, action.areURL).then(channelIds => {
                        log.warn(channelIds);
                        thiz.areComponentEventChannels = channelIds;
                    });
                    areService.getComponentInputPortIds(newComponentId, action.areURL).then(inputPortIds => {
                        log.warn(inputPortIds);
                        thiz.areComponentPorts = inputPortIds;
                    });
                }
            },
            downloadModelFile(areModel) {
                var blob = new Blob([window.atob(areModel.modelDataBase64)], {type: "text/plain;charset=utf-8"});
                var name = areModel.areModelName.indexOf('.acs') != -1 ? areModel.areModelName : areModel.areModelName + '.acs';
                FileSaver.saveAs(blob, name);
            },
            save () {
                var thiz = this;
                dataService.updateOrAddGridElement(this.gridData.id, this.gridElement).then(() => {
                    thiz.$emit('close');
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                dataService.updateOrAddGridElement(this.gridData.id, this.gridElement).then(() => {
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection);
                    thiz.initInternal();
                    $('#selectActionType').focus();
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

    input, .full-width {
        width: 100%;
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