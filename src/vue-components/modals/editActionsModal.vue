<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" v-if="gridElement" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()" @keydown.ctrl.right="editNext()" @keydown.ctrl.left="editNext(true)" @keydown.ctrl.y="save(true)">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">
                            <span data-i18n>Edit actions // Aktionen bearbeiten</span>
                            <span>
                                <span v-show="gridElement.type === GridElement.ELEMENT_TYPE_NORMAL">("{{gridElement.label | extractTranslation}}")</span>
                                <span v-show="gridElement.type !== GridElement.ELEMENT_TYPE_NORMAL">("{{gridElement.type | translate}}")</span>
                            </span>
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
                                                        <option data-i18n="" :value="undefined">automatic (current language) // automatisch (aktuelle Sprache)</option>
                                                        <option v-for="lang in voiceLangs" :value="lang.code">
                                                            {{lang | extractTranslation}}
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
                                                    <option data-i18n="" :value="undefined">automatic (current language) // automatisch (aktuelle Sprache)</option>
                                                    <option v-for="lang in voiceLangs" :value="lang.code">
                                                        {{lang | extractTranslation}}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="inCustomText" class="normal-text" data-i18n>Text to speak // Auszusprechender Text</label>
                                                </div>
                                                <div class="nine columns">
                                                    <input id="inCustomText" type="text" v-model="action.speakText[currentLang]" style="width: 70%"/>
                                                    <button @click="testAction(action)"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName == 'GridActionNavigate'">
                                            <div class="row">
                                                <input id="navigateBackChkbox" type="checkbox" v-model="action.toLastGrid"/>
                                                <label for="navigateBackChkbox" class="normal-text" data-i18n>Navigate to last opened grid // Zum zuletzt geöffneten Grid navigieren</label>
                                            </div>
                                            <div class="row">
                                                <div class="three columns">
                                                    <label for="selectGrid" class="normal-text" data-i18n>Navigate to grid // Navigieren zu Grid</label>
                                                </div>
                                                <select class="eight columns" id="selectGrid" type="text" v-model="action.toGridId" :disabled="action.toLastGrid">
                                                    <option v-for="(label, id) in gridLabels" :value="id">
                                                        {{label | extractTranslation}}
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
                                                    <option :value="undefined" data-i18n="">all dictionaries // alle Wörterbücher</option>
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
                                                    <label for="selectCollectElmAction" class="five columns normal-text" data-i18n>Perform action on collect element // Aktion für Sammelelement ausführen</label>
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
                                            <div class="row" v-show="action.action === 'WEBRADIO_ACTION_START' || action.action === 'WEBRADIO_ACTION_TOGGLE'">
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
                                                    <radio-list-selector v-model="gridData"></radio-list-selector>
                                                </accordion>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName === 'GridActionYoutube'">
                                            <div class="row">
                                                <div class="twelve columns">
                                                    <label for="ytActions" class="five columns normal-text" data-i18n>YouTube video action // YouTube-Video Aktion</label>
                                                    <select id="ytActions" class="six columns" v-model="action.action">
                                                        <option v-for="elmAction in GridActionYoutube.actions" :value="elmAction">
                                                            {{elmAction | translate}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row" v-show="[GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
                                                <div class="twelve columns">
                                                    <label for="ytPlayType" class="five columns normal-text" data-i18n>Play type // Wiedergabe Typ</label>
                                                    <select id="ytPlayType" class="six columns" v-model="action.playType">
                                                        <option v-for="playType in Object.keys(GridActionYoutube.playTypes).filter(t => t !== GridActionYoutube.playTypes.YT_PLAY_RELATED)" :value="playType">{{playType | translate}}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div v-show="action.playType && [GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
                                                <div class="row" v-show="action.playType !== GridActionYoutube.playTypes.YT_PLAY_RELATED">
                                                    <div class="twelve columns">
                                                        <label for="ytList" class="five columns normal-text">
                                                            <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_VIDEO" data-i18n="">Video link // Video Link</span>
                                                            <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_SEARCH" data-i18n="">YouTube search query // YouTube Suchanfrage</span>
                                                            <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_PLAYLIST" data-i18n="">YouTube playlist link // YouTube Playlist Link</span>
                                                            <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_CHANNEL" data-i18n="">YouTube channel link // YouTube Channel-Link</span>
                                                        </label>
                                                        <input id="ytList" type="text" class="six columns" v-model="action.data"/>
                                                    </div>
                                                </div>
                                                <div class="row">
                                                    <input id="showCC" type="checkbox" v-model="action.showCC"/>
                                                    <label for="showCC" class="normal-text" data-i18n="">Show video subtitles (if available) // Zeige Video-Untertitel (wenn verfügbar)</label>
                                                </div>
                                                <div class="row">
                                                    <input id="playMuted" type="checkbox" v-model="action.playMuted"/>
                                                    <label for="playMuted" class="normal-text" data-i18n="">Start video muted // Video stummgeschaltet starten</label>
                                                </div>
                                                <div class="row">
                                                    <input id="afterNav" type="checkbox" v-model="action.performAfterNav"/>
                                                    <label for="afterNav" class="normal-text" data-i18n="">Perform action after navigation // Aktion erst nach Navigation ausführen</label>
                                                </div>
                                            </div>
                                            <div class="row" v-show="[GridActionYoutube.actions.YT_STEP_FORWARD, GridActionYoutube.actions.YT_STEP_BACKWARD].indexOf(action.action) !== -1">
                                                <div class="twelve columns">
                                                    <label for="stepSeconds" class="five columns normal-text" data-i18n>{{action.action | translate}} <span data-i18n="">(seconds) // (Sekunden)</span></label>
                                                    <input id="stepSeconds" type="number" class="six columns" v-model="action.stepSeconds" min="0"/>
                                                </div>
                                            </div>
                                            <div class="row" v-show="[GridActionYoutube.actions.YT_VOLUME_UP, GridActionYoutube.actions.YT_VOLUME_DOWN].indexOf(action.action) !== -1">
                                                <div class="twelve columns">
                                                    <label for="stepVolume" class="five columns normal-text" data-i18n>{{action.action | translate}} <span data-i18n="">(precent) // (Prozent)</span></label>
                                                    <input id="stepVolume" type="number" class="six columns" v-model="action.stepVolume" min="0" max="100"/>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
                                            </div>
                                        </div>
                                        <div v-if="action.modelName === 'GridActionChangeLang'">
                                            <div class="row">
                                                <div class="twelve columns">
                                                    <label for="changeLang" class="five columns normal-text" data-i18n>Change application language to // Sprache der Anwendung ändern zu</label>
                                                    <select id="changeLang" class="six columns" v-model="action.language">
                                                        <option data-i18n="" :value="undefined">System language // Systemsprache</option>
                                                        <option v-for="lang in (selectFromAllLanguages ? allLanguages : gridLanguages)" :value="lang.code">
                                                            {{lang | extractTranslation}}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <input id="selectFromAllLangs" type="checkbox" v-model="selectFromAllLanguages"/>
                                                <label for="selectFromAllLangs" data-i18n="">Show all Languages for selection // Zeige alle Sprachen zur Auswahl</label>
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
                            <div class="hide-mobile row">
                                <button @click="save(true)" :disabled="false" title="Keyboard: [Ctrl + Y]" class="four columns offset-by-eight"><span data-i18n>OK, to "edit element" // OK, zu "Element bearbeiten"</span> <i class="fas fa-pencil-alt"/></button>
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
    import Accordion from "../components/accordion.vue";
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridImage} from "../../js/model/GridImage";
    import RadioListSelector from "../components/radioListSelector.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";

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
                currentLang: i18nService.getBrowserLang(),
                allLanguages: i18nService.getAllLanguages(),
                gridLanguages: null,
                selectFromAllLanguages: false,
                GridActionYoutube: GridActionYoutube,
                GridElement: GridElement
            }
        },
        components: {
            RadioListSelector,
            Accordion,
            EditAreAction
        },
        methods: {
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
            save (toEdit) {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    thiz.$emit('close');
                    if (toEdit) {
                        thiz.$emit('edit');
                    }
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
                thiz.gridData.gridElements.forEach((e, index) => {
                    if (e.id === thiz.gridElement.id) {
                        thiz.gridData.gridElements[index] = thiz.gridElement;
                    }
                });
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
                    let langKeys = Object.keys(thiz.gridData.label);
                    thiz.gridLanguages = thiz.allLanguages.filter(lang => langKeys.indexOf(lang.code) !== -1);
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
</style>