<template>
    <div class="modal">
        <div class="modal-mask" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" @keyup.ctrl.right="editNext()" @keyup.ctrl.left="editNext(true)">
            <div class="modal-wrapper">
                <div class="modal-container" v-if="gridElement">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">
                            <span data-i18n>Edit actions // Aktionen bearbeiten</span> <span>("{{gridElement.label}}")</span>
                            <img class="spaced" v-if="gridElement.image" id="imgPreview" :src="gridElement.image.data" style="max-height: 1.5em; margin-bottom: -0.3em;"/>
                        </h1>
                    </div>

                    <div class="modal-body" v-if="gridElement">
                        <div class="row">
                            <label class="three columns" data-i18n="">New Action // Neue Aktion</label>
                            <select id="selectActionType" v-focus="" class="four columns" v-model="selectedNewAction" style="margin-bottom: 0.5em">
                                <option v-for="type in actionTypes" :value="type.getModelName()">{{type.getModelName() | translate}}</option>
                            </select>
                            <button class="four columns" @click="addAction()"><i class="fas fa-plus"/> <span data-i18n="">Add action // Aktion hinzufügen</span></button>
                        </div>
                        <div class="row">
                            <h2 for="actionList" class="twelve columns" data-i18n="" style="margin-top: 1em; font-size: 1.2em">Current actions // Aktuelle Aktionen</h2>
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
                                    <div class="eight columns actionbtns">
                                        <button @click="editAction(action)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span></button>
                                        <button @click="deleteAction(action)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                                        <button v-if="action.modelName != 'GridActionNavigate'" @click="testAction(action)"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                    </div>
                                </div>
                                <div v-if="editActionId == action.id">
                                    <div class>
                                        <b>{{action.modelName | translate}}</b> <a class="black" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
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
                                            <div class="row" v-show="gridElement.type === GridElementClass.ELEMENT_TYPE_COLLECT">
                                                <div class="eight columns">
                                                    <input id="chkSuggestOnChange" type="checkbox" v-model="action.suggestOnChange">
                                                    <label for="chkSuggestOnChange" class="normal-text" data-i18n>Refresh suggestions on change // Vorschläge bei Änderung aktualisieren</label>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="comboUseDict" class="normal-text" data-i18n>Dictionary to use // Zu verwendendes Wörterbuch</label>
                                                </div>
                                                <select class="eight columns" id="comboUseDict" v-model="action.dictionaryKey">
                                                    <option v-for="id in dictionaryKeys" :value="id">
                                                        {{id}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionCollectElement'">
                                            <div class="row">
                                                <div class="twelve columns">
                                                    <label for="selectCollectElmAction" class="five columns normal-text" data-i18n>Perform action on collect elements // Aktion für Sammelelemente ausführen</label>
                                                    <select id="selectCollectElmAction" class="six columns" v-model="action.action">
                                                        <option v-for="elmAction in collectActions" :value="elmAction">
                                                            {{elmAction | translate}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionWebradio'">
                                            <div class="row">
                                                <div class="twelve columns">
                                                    <label for="selectRadioElmAction" class="five columns normal-text" data-i18n>Web radio action // Web-Radio Aktion</label>
                                                    <select id="selectRadioElmAction" class="six columns" v-model="action.action">
                                                        <option v-for="elmAction in webradioActions" :value="elmAction">
                                                            {{elmAction | translate}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row" v-show="action.action === 'WEBRADIO_ACTION_START'">
                                                <div class="twelve columns">
                                                    <label for="selectRadio" class="five columns normal-text" data-i18n>Webadio to play // Abzuspielendes Webradio</label>
                                                    <select id="selectRadio" class="six columns" v-model="action.radioId" @change="selectedRadioChanged(action.radioId)">
                                                        <option value="" selected data-i18n="">automatic (last played) // automatisch (zuletzt gespielt)</option>
                                                        <option v-for="webradio in gridData.webRadios" :value="webradio.radioId">
                                                            {{webradio.radioName}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div class="row">
                                                <accordion acc-label="Manage webradio list // Webradioliste verwalten" :acc-open="gridData.webRadios.length === 0 ? 'true' : 'false'" class="twelve columns">
                                                    <h3 data-i18n="">Selected radio stations // Ausgewählte Radiosender</h3>
                                                    <div class="row">
                                                        <ul class="webradioList">
                                                            <li v-for="webradio in gridData.webRadios">
                                                                <div class="webRadioListItem">
                                                                    <img :src="webradio.faviconUrl"/>
                                                                    <div class="webRadioLabel">{{webradio.radioName}}</div>
                                                                    <div class="webRadioButtons">
                                                                        <button class="right" @click="webradioService.stop(webradio.radioId); gridData.webRadios = gridData.webRadios.filter(radio => radio.radioId !== webradio.radioId)"><span class="hide-mobile">Remove </span><i class="fas fa-trash"></i></button>
                                                                        <button v-if="webradioPlaying !== webradio" class="right" @click="webradioPlaying = webradio; webradioService.play(webradio)"><span class="hide-mobile">Play </span><i class="fas fa-play"></i></button>
                                                                        <button v-if="webradioPlaying === webradio" class="right" @click="webradioPlaying = null; webradioService.stop()"><span class="hide-mobile">Stop </span><i class="fas fa-pause"></i></button>
                                                                        <button class="right" @click="moveWebradioUp(webradio)"><span class="hide-mobile">Up </span><i class="fas fa-arrow-up"></i></button>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                            <li v-if="gridData.webRadios.length === 0" data-i18n="" style="outline: none">No selected radio stations, use search bar below to add radio stations. // Keine ausgewählten Radiosender, verwenden Sie die Suche unten um Radiosender hinzuzufügen.</li>
                                                        </ul>
                                                    </div>

                                                    <h3 data-i18n="">Webradio search // Webradio Suche</h3>
                                                    <div class="row">
                                                        <label for="searchwebradios" class="five columns normal-text" data-i18n>Search term // Suchbegriff</label>
                                                        <input id="searchwebradios" class="six columns" type="text" v-model="webradioSearch" v-debounce="500" @change="searchWebradios"/>
                                                    </div>
                                                    <div class="row">
                                                        <ul class="webradioList">
                                                            <li v-for="webradio in webradioSearchResults">
                                                                <div class="webRadioListItem">
                                                                    <img :src="webradio.faviconUrl"/>
                                                                    <div class="webRadioLabel">{{webradio.radioName}}</div>
                                                                    <div class="webRadioButtons">
                                                                        <button class="right" @click="gridData.webRadios.push(webradio)" :disabled="gridData.webRadios.indexOf(webradio) > -1"><span class="hide-mobile">Select </span><i class="fas fa-plus"></i></button>
                                                                        <button v-if="webradioPlaying !== webradio" class="right" @click="webradioPlaying = webradio; webradioService.play(webradio)"><span class="hide-mobile">Play </span><i class="fas fa-play"></i></button>
                                                                        <button v-if="webradioPlaying === webradio" class="right" @click="webradioPlaying = null; webradioService.stop()"><span class="hide-mobile">Stop </span><i class="fas fa-pause"></i></button>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </accordion>
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
                            <div class="row">
                                <button @click="$emit('close')" title="Keyboard: [Esc]" class="four columns offset-by-four">
                                    <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                                </button>
                                <button  @click="save()" title="Keyboard: [Ctrl + Enter]" class="four columns">
                                    <i class="fas fa-check"/> <span>OK</span>
                                </button>
                            </div>
                            <div class="hide-mobile row">
                                <button @click="editNext(true)" :disabled="false" title="Keyboard: [Ctrl + Left]" class="four columns offset-by-four"><i class="fas fa-angle-double-left"/> <span data-i18n>OK, edit previous // OK, voriges bearbeiten</span></button>
                                <button @click="editNext()" :disabled="false" title="Keyboard: [Ctrl + Right]" class="four columns"><span data-i18n>OK, edit next // OK, nächstes bearbeiten</span> <i class="fas fa-angle-double-right"/></button>
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
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import EditAreAction from "./editActionsSub/editAREAction.vue";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement";
    import {helpService} from "../../js/service/helpService";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import {webradioService} from "../../js/service/webradioService";
    import Accordion from "../components/accordion.vue";
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridImage} from "../../js/model/GridImage";

    export default {
        props: ['editElementIdParam', 'gridIdParam'],
        data: function () {
            return {
                gridData: null,
                gridElement: null,
                GridElementClass: GridElement,
                editActionId: null,
                selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
                gridLabels: null,
                actionTypes: GridElement.getActionTypes(),
                voiceLangs: speechService.getVoicesLangs(),
                dictionaryKeys: predictionService.getDictionaryKeys(),
                editElementId: null,
                additionalGridFiles: {}, //map: key = action.id, value = AdditionalGridFile (ARE Model)
                collectActions: GridActionCollectElement.getActions(),
                webradioActions: GridActionWebradio.getActions(),
                webradioSearchResults: [],
                webradioSearch: null,
                webradioService: webradioService,
                webradioPlaying: null
            }
        },
        components: {
            Accordion,
            EditAreAction
        },
        methods: {
            searchWebradios() {
                let thiz = this;
                webradioService.search(thiz.webradioSearch).then(result => {
                    thiz.webradioSearchResults = result;
                });
            },
            moveWebradioUp(radio) {
                let index = this.gridData.webRadios.indexOf(radio);
                if (index > 0) {
                    this.gridData.webRadios.splice(index - 1, 0, this.gridData.webRadios.splice(index, 1)[0]);
                }
            },
            selectedRadioChanged(radioId) {
                let faviconUrl = this.gridData.webRadios.filter(el => el.radioId === radioId)[0].faviconUrl;
                if (faviconUrl) {
                    imageUtil.urlToBase64(faviconUrl).then(base64 => {
                        if (base64) {
                            this.gridElement.image = new GridImage({data: base64});
                        }
                    });
                }
            },
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
            openHelp() {
                helpService.openHelp();
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
                let thiz = this;
                return dataService.saveGrid(thiz.gridData).then(() => {
                    return dataService.saveAdditionalGridFiles(thiz.gridData.id, Object.values(thiz.additionalGridFiles)).then(() => {
                        thiz.$emit('reload');
                        return Promise.resolve();
                    });
                });
            },
            initInternal() {
                let thiz = this;
                dataService.getGrid(thiz.gridIdParam).then(data => {
                    thiz.gridData = JSON.parse(JSON.stringify(data));
                    thiz.gridElement = thiz.gridData.gridElements.filter(el => el.id === thiz.editElementId)[0];
                });
                dataService.getGridsAttribute('label').then(map => {
                    thiz.gridLabels = map;
                });
            }
        },
        mounted () {
            this.editElementId = this.editElementIdParam;
            this.initInternal();
            helpService.setHelpLocation('05_actions', '#edit-actions-modal');
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            helpService.setHelpLocation('02_navigation', '#edit-view');
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

    .actionbtns button {
        width: 30%;
        padding: 0;
    }

    .webradioList button {
        line-height: unset;
        margin-bottom: 0;
        padding: 0 10px;
    }

    .webradioList, .webradioList li, .webradioList li div {
        padding: 0;
        margin: 0;
    }

    #webradioList li:hover {
        background-color: #c4f0fe;
    }

    .webRadioListItem {
        display: flex;
    }

    .webRadioListItem img {
        flex-grow: 0;
        flex-shrink: 0;
        vertical-align: middle;
        height: 28px;
        width: 28px;
    }

    .webRadioLabel {
        flex-grow: 1;
        flex-shrink: 1;
        margin: 0 5px !important;
    }

    .webRadioButtons {
        flex-grow: 0;
        flex-shrink: 0;
    }
</style>