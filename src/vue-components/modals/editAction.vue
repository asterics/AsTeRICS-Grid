<template>
<div>
    <div v-if="action.modelName == 'GridActionSpeak'">
        <div class="srow">
            <div class="four columns">
                <label for="selectLang" class="normal-text">{{ $t('language') }}</label>
            </div>
            <select class="eight columns" id="selectLang" v-model="action.speakLanguage">
                <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                <option v-for="lang in voiceLangs" :value="lang.code">
                    {{lang | extractTranslation}}
                </option>
            </select>
        </div>
        <div class="srow" v-if="action.speakLanguage">
            <div class="eight columns offset-by-four">
                <span>{{ $t('label') }}</span><span> ({{ $t('lang.' + action.speakLanguage) }})</span>: {{gridElement.label[action.speakLanguage]}}
            </div>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionSpeakCustom'">
        <div class="srow">
            <div class="four columns">
                <label for="selectLang2" class="normal-text">{{ $t('language') }}</label>
            </div>
            <select class="eight columns" id="selectLang2" v-model="action.speakLanguage">
                <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                <option v-for="lang in voiceLangs" :value="lang.code">
                    {{lang | extractTranslation}}
                </option>
            </select>
        </div>
        <div class="srow">
            <div class="four columns">
                <label for="inCustomText" class="normal-text">{{ $t('textToSpeak') }}</label>
            </div>
            <input class="eight columns" id="inCustomText" type="text" v-model="action.speakText[getCurrentSpeakLang(action)]" :placeholder="gridElement.type === GridElement.ELEMENT_TYPE_LIVE ? $t('canIncludePlaceholderLike') : ''"/>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionAudio'">
        <edit-audio-action :action="action" :grid-data="gridData"></edit-audio-action>
    </div>
    <div v-if="action.modelName == 'GridActionWordForm'">
        <edit-word-form-action :action="action" :grid-data="gridData"></edit-word-form-action>
    </div>
    <div v-if="action.modelName == 'GridActionNavigate'">
        <div class="srow">
            <label for="selectNavType" class="four columns normal-text">{{ $t('navigationType') }}</label>
            <select class="eight columns" id="selectNavType" v-model="action.navType">
                <option v-for="type in Object.values(GridActionNavigate.NAV_TYPES)" :value="type">{{ type | translate }}</option>
            </select>
        </div>
        <div class="srow" v-if="action.navType === GridActionNavigate.NAV_TYPES.TO_GRID">
            <div class="four columns">
                <label for="selectGrid" class="normal-text">{{ $t('navigateToGrid') }}</label>
            </div>
            <select class="eight columns" id="selectGrid" v-model="action.toGridId">
                <option v-for="grid in grids" :value="grid.id">
                    {{grid.label | extractTranslation}}
                </option>
            </select>
        </div>
        <div v-if="action.navType === GridActionNavigate.NAV_TYPES.OPEN_SEARCH">
            <div class="srow">
                <label for="searchTextInput" class="four columns normal-text">{{ $t('searchForCustomText') }}</label>
                <input id="searchTextInput" class="eight columns" type="text" v-model="action.searchText" :placeholder="$t('customText')"/>
            </div>
            <div class="srow">
                <input id="searchCollected" type="checkbox" v-model="action.searchCollectedText"/>
                <label for="searchCollected" class="normal-text">{{ $t('searchForCollectedText') }}</label>
            </div>
        </div>
        <div class="srow">
            <input id="addToCollectChk" type="checkbox" v-model="action.addToCollectElem"/>
            <label for="addToCollectChk" class="normal-text">{{ $t('addThisElementToCollectionElementsDespiteNav') }}</label>
        </div>
    </div>
    <div v-if="action.modelName === 'GridActionARE'">
        <edit-are-action :action="action" :grid-data="gridData"/>
    </div>
    <div v-if="action.modelName === 'GridActionOpenHAB'">
        <edit-open-hab-action :action="action" :grid-data="gridData"/>
    </div>
    <div v-if="action.modelName === 'GridActionHTTP'">
      <edit-http-action :action="action"/>
    </div>
    <div v-if="action.modelName === 'GridActionPredefined'">
        <edit-predefined-action :action="action" :grid-data="gridData" v-on="$listeners"/>
    </div>
    <div v-if="action.modelName === 'GridActionMatrix'">
        <edit-matrix-action :action="action"/>
    </div>
    <div v-if="action.modelName == 'GridActionPredict'">
        <div class="srow" v-show="gridElement.type === GridElement.ELEMENT_TYPE_COLLECT">
            <div class="eight columns">
                <input id="chkSuggestOnChange" type="checkbox" v-model="action.suggestOnChange">
                <label for="chkSuggestOnChange" class="normal-text">{{ $t('refreshSuggestionsOnChange') }}</label>
            </div>
        </div>
        <div class="srow">
            <div class="four columns">
                <label for="comboUseDict" class="normal-text">{{ $t('dictionaryToUse') }}</label>
            </div>
            <select class="eight columns" id="comboUseDict" v-model="action.dictionaryKey">
                <option :value="null">{{ $t('allDictionaries') }}</option>
                <option :value="GridActionPredict.USE_DICTIONARY_CURRENT_LANG">{{ $t('useDictionaryOfCurrentContentLanguage') }}</option>
                <option v-for="id in dictionaryKeys" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionCollectElement'">
        <div class="srow">
            <div class="twelve columns">
                <label for="selectCollectElmAction" class="four columns normal-text">{{ $t('performActionOnCollectElement') }}</label>
                <select id="selectCollectElmAction" class="eight columns" v-model="action.action">
                    <option v-for="elmAction in collectActions" :value="elmAction">
                        {{elmAction | translate}}
                    </option>
                </select>
            </div>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionWebradio'">
        <div class="srow">
            <div class="twelve columns">
                <label for="selectRadioElmAction" class="four columns normal-text">{{ $t('webRadioAction') }}</label>
                <select id="selectRadioElmAction" class="eight columns" v-model="action.action">
                    <option v-for="elmAction in webradioActions" :value="elmAction">
                        {{elmAction | translate}}
                    </option>
                </select>
            </div>
        </div>
        <div class="srow" v-show="action.action === 'WEBRADIO_ACTION_START' || action.action === 'WEBRADIO_ACTION_TOGGLE'">
            <div class="twelve columns">
                <label for="selectRadio" class="four columns normal-text">{{ $t('webadioToPlay') }}</label>
                <select id="selectRadio" class="eight columns" v-model="action.radioId" @change="selectedRadioChanged(action.radioId)">
                    <option value="" selected>{{ $t('automaticLastPlayed') }}</option>
                    <option v-for="webradio in gridData.webRadios" :value="webradio.radioId">
                        {{webradio.radioName}}
                    </option>
                </select>
            </div>
        </div>
        <div class="srow">
            <accordion :acc-label="$t('manageWebradioList')" :acc-open="gridData.webRadios.length === 0" class="twelve columns">
                <radio-list-selector :grid-data="gridData"></radio-list-selector>
            </accordion>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionPodcast'">
        <edit-podcast-action :action="action" :grid-data="gridData"></edit-podcast-action>
    </div>
    <div v-if="action.modelName === 'GridActionYoutube'">
        <div class="srow">
            <div class="twelve columns">
                <label for="ytActions" class="four columns normal-text">{{ $t('youtubeVideoAction') }}</label>
                <select id="ytActions" class="eight columns" v-model="action.action">
                    <option v-for="elmAction in GridActionYoutube.actions" :value="elmAction">
                        {{elmAction | translate}}
                    </option>
                </select>
            </div>
        </div>
        <div class="srow" v-show="[GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
            <div class="twelve columns">
                <label for="ytPlayType" class="four columns normal-text">{{ $t('playType') }}</label>
                <select id="ytPlayType" class="eight columns" v-model="action.playType">
                    <option v-for="playType in Object.keys(GridActionYoutube.playTypes).filter(t => t !== GridActionYoutube.playTypes.YT_PLAY_RELATED)" :value="playType">{{playType | translate}}</option>
                </select>
            </div>
        </div>
        <div v-show="action.playType && [GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
            <div class="srow" v-show="action.playType !== GridActionYoutube.playTypes.YT_PLAY_RELATED">
                <div class="twelve columns">
                    <label for="ytList" class="four columns normal-text">
                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_VIDEO">{{ $t('videoLink') }}</span>
                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_SEARCH">{{ $t('youtubeSearchQuery') }}</span>
                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_PLAYLIST">{{ $t('youtubePlaylistLink') }}</span>
                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_CHANNEL">{{ $t('youtubeChannelLink') }}</span>
                    </label>
                    <input id="ytList" type="text" class="eight columns" v-model="action.data"/>
                </div>
            </div>
            <div class="srow">
                <input id="showCC" type="checkbox" v-model="action.showCC"/>
                <label for="showCC" class="normal-text">{{ $t('showVideoSubtitlesIfAvailable') }}</label>
            </div>
            <div class="srow">
                <input id="playMuted" type="checkbox" v-model="action.playMuted"/>
                <label for="playMuted" class="normal-text">{{ $t('startVideoMuted') }}</label>
            </div>
            <div class="srow">
                <input id="afterNav" type="checkbox" v-model="action.performAfterNav"/>
                <label for="afterNav" class="normal-text">{{ $t('performActionAfterNavigation') }}</label>
            </div>
        </div>
        <div class="srow" v-show="[GridActionYoutube.actions.YT_STEP_FORWARD, GridActionYoutube.actions.YT_STEP_BACKWARD].indexOf(action.action) !== -1">
            <div class="twelve columns">
                <label for="stepSeconds" class="four columns normal-text">{{ $t(action.action) }} {{ $t('secondsBracket') }}</label>
                <input id="stepSeconds" type="number" class="eight columns" v-model="action.stepSeconds" min="0"/>
            </div>
        </div>
        <div class="srow" v-show="[GridActionYoutube.actions.YT_VOLUME_UP, GridActionYoutube.actions.YT_VOLUME_DOWN].indexOf(action.action) !== -1">
            <div class="twelve columns">
                <label for="stepVolume" class="four columns normal-text">{{ $t(action.action) }} {{ $t('percentBracket') }}</label>
                <input id="stepVolume" type="number" class="eight columns" v-model="action.stepVolume" min="0" max="100"/>
            </div>
        </div>
    </div>
    <div v-if="action.modelName === 'GridActionChangeLang'">
        <div class="srow">
            <div class="twelve columns">
                <label for="changeLang" class="four columns normal-text">{{ $t('changeLanguageTo') }}</label>
                <select id="changeLang" class="four columns mb-2" v-model="action.language">
                    <option :value="undefined">{{ $t('systemLanguage') }}</option>
                    <option :value="GridActionChangeLang.LAST_LANG">{{ $t(GridActionChangeLang.LAST_LANG) }}</option>
                    <option v-for="lang in allLanguages" :value="lang.code" v-show="selectFromAllLanguages || lang.code === action.language || gridLanguageCodes.includes(lang.code)">
                        {{lang | extractTranslation}}
                    </option>
                </select>
                <div class="four columns">
                    <input id="selectFromAllLangs" type="checkbox" v-model="selectFromAllLanguages"/>
                    <label for="selectFromAllLangs" class="normal-text">{{ $t('showAllLanguages') }}</label>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="twelve columns">
                <label for="changeVoice" class="four columns normal-text">{{ $t('changeVoiceTo') }}</label>
                <select id="changeVoice" class="four columns mb-2" v-model="action.voice">
                    <option :value="undefined">{{ $t('automatic') }}</option>
                    <option v-for="voice in allVoices" :value="voice.id" v-show="selectFromAllVoices || !action.language || i18nService.getBaseLang(voice.lang) === i18nService.getBaseLang(action.language)">
                        <span v-if="!selectFromAllVoices && action.language">{{voice.name}}, {{voice.local ? $t('offline') : $t('online')}}</span>
                        <span v-if="selectFromAllVoices || !action.language">{{ $t(`lang.${voice.lang}`) }}: {{voice.name}}, {{voice.local ? $t('offline') : $t('online')}}</span>
                    </option>
                </select>
                <div class="four columns mb-2">
                    <input id="selectAllVoices" type="checkbox" v-model="selectFromAllVoices"/>
                    <label for="selectAllVoices" class="normal-text">{{ $t('showAllVoices') }}</label>
                </div>
            </div>
        </div>
        <div class="srow">
            <button id="testVoice2" class="four columns offset-by-four" :disabled="!action.voice" @click="speechService.testSpeak(action.voice, null, action.language)">{{ $t('testVoice') }}</button>
        </div>
    </div>
    <div v-if="action.modelName === 'GridActionOpenWebpage'">
        <div class="srow">
            <div class="twelve columns">
                <label for="openUrl" class="four columns normal-text">{{ $t('webpageUrl') }}</label>
                <input id="openUrl" type="text" class="eight columns" v-model="action.openURL"/>
            </div>
        </div>
        <div class="srow">
            <div class="twelve columns">
                <label for="webpageCloseTimeout" class="four columns normal-text">{{ $t('automaticallyCloseTimeoutInSeconds') }}</label>
                <input id="webpageCloseTimeout" type="number" min="0" class="eight columns" v-model="action.timeoutSeconds"/>
            </div>
        </div>
    </div>
    <div v-if="action.modelName === GridActionUART.getModelName()">
        <div class="srow">
            <div class="twelve columns">
                <label for="uartType" class="four columns normal-text">UART Type</label>
                <select id="uartType" class="eight columns" v-model="action.connectionType">
                    <option v-for="type in GridActionUART.CONN_TYPES" :value="type">{{ type | translate}}</option>
                </select>
            </div>
        </div>
        <div class="srow">
            <div class="twelve columns">
                <label for="uartCmd" class="four columns normal-text">{{ $t('dataToSend') }}</label>
                <div class="eight columns">
                  <textarea id="uartCmd" v-model="action.data" class="col-12" rows="1"
                    placeholder="LED1.set(); or AT MX 10" spellcheck="false" type="text"/>
                </div>
            </div>
        </div>
    </div>
    <div v-if="action.modelName === GridActionSystem.getModelName()">
        <div class="srow">
            <div class="twelve columns">
                <label for="systemActionType" class="four columns normal-text">{{ $t('actionType') }}</label>
                <select id="systemActionType" class="eight columns" v-model="action.action" @change="action.actionValue = action.action === GridActionSystem.actions.SYS_UPDATE_LIVE_ELEMENTS ? 0 : 10">
                    <option v-for="action in GridActionSystem.actions" :value="action">{{ action | translate}}</option>
                </select>
            </div>
        </div>
        <div class="srow" v-if="[GridActionSystem.actions.SYS_VOLUME_UP, GridActionSystem.actions.SYS_VOLUME_DOWN].includes(action.action)">
            <div class="twelve columns">
                <label for="systemActionValue" class="four columns normal-text">{{ $t(action.action) }} {{ $t('percentBracket') }}</label>
                <input id="systemActionValue" type="number" class="eight columns" min="0" max="100" v-model.number="action.actionValue">
            </div>
        </div>
        <div class="srow" v-if="[GridActionSystem.actions.SYS_UPDATE_LIVE_ELEMENTS].includes(action.action)">
            <div class="twelve columns">
                <label for="systemActionDelay" class="four columns normal-text">{{ $t('delayMs') }}</label>
                <input id="systemActionDelay" type="number" class="eight columns" min="0" v-model.number="action.actionValue">
            </div>
        </div>
    </div>
</div>
</template>

<script>
    import {speechService} from './../../js/service/speechService'
    import {predictionService} from "../../js/service/predictionService";
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import EditAreAction from "./editActionsSub/editAREAction.vue";
    import EditOpenHabAction from "./editActionsSub/editOpenHABAction.vue";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import Accordion from "../components/accordion.vue";
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridImage} from "../../js/model/GridImage";
    import RadioListSelector from "../components/radioListSelector.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import EditAudioAction from "./editActionsSub/editAudioAction.vue";
    import EditWordFormAction from "./editActionsSub/editWordFormAction.vue";
    import EditHttpAction from "./editActionsSub/editHttpAction.vue";
    import {GridActionUART} from "../../js/model/GridActionUART.js";
    import { GridActionPredict } from '../../js/model/GridActionPredict';
    import { gridUtil } from '../../js/util/gridUtil';
    import { GridActionSystem } from '../../js/model/GridActionSystem';
    import { GridActionChangeLang } from '../../js/model/GridActionChangeLang';
    import EditPredefinedAction from './editActionsSub/editPredefinedAction.vue';
    import EditMatrixAction from './editActionsSub/editMatrixAction.vue';
    import EditPodcastAction from './editActionsSub/editPodcastAction.vue';

    export default {
        props: ['action', 'grids', 'gridData', 'gridElement'],
        data: function () {
            return {
                allVoices: speechService.getVoices(),
                voiceLangs: speechService.getVoicesLangs(),
                dictionaryKeys: predictionService.getDictionaryKeys(),
                collectActions: GridActionCollectElement.getActions(),
                webradioActions: GridActionWebradio.getActions(),
                allLanguages: i18nService.getAllLanguages(),
                gridLanguageCodes: [],
                selectFromAllLanguages: false,
                selectFromAllVoices: false,
                GridActionYoutube: GridActionYoutube,
                GridActionNavigate: GridActionNavigate,
                GridActionUART: GridActionUART,
                GridActionPredict: GridActionPredict,
                GridActionSystem: GridActionSystem,
                GridActionChangeLang: GridActionChangeLang,
                GridElement: GridElement,
                speechService: speechService,
                i18nService: i18nService
            }
        },
        components: {
            EditPodcastAction,
            EditMatrixAction,
            EditPredefinedAction,
            EditWordFormAction,
            EditAudioAction,
            RadioListSelector,
            Accordion,
            EditAreAction,
            EditOpenHabAction,
            EditHttpAction
        },
        methods: {
            getCurrentSpeakLang(action) {
                let prefVoiceLang = speechService.getPreferredVoiceLang() || i18nService.getContentLang();
                let currentVoiceLang = speechService.isVoiceLangLinkedToTextLang()  ? prefVoiceLang : i18nService.getContentLang();
                return action && action.speakLanguage ? action.speakLanguage : currentVoiceLang;
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
        },
        mounted () {
            this.gridLanguageCodes = gridUtil.getGridLangs(this.gridData);
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    .normal-text {
        font-weight: normal;
    }
</style>