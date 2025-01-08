<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('gridContentLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="contentLang">{{ $t('selectLanguage') }}</label>
                    <select class="five columns mb-2" id="contentLang" v-model="userSettingsLocal.contentLang" @change="saveUserSettingsLocal()">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="lang in selectLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                    <div class="four columns">
                        <input id="selectAllLanguages" type="checkbox" v-model="selectAllLanguages" @change="showAllLangsChanged()"/>
                        <label for="selectAllLanguages">{{ $t('showAllLanguages') }}</label>
                    </div>
                </div>
                <div class="srow">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                        {{ $t('gridsCanBeTranslatedToEveryLanguage') }}
                    </span>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('voice') }}</h3>
                <div class="srow">
                    <label class="three columns" for="inVoice">
                        <span>{{ $t('preferredVoice') }}</span>
                    </label>
                    <select id="inVoice" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.preferredVoice" @change="resetVoiceProps(); saveUserSettingsLocal()">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="voice in selectVoices" :value="voice.id">
                            <span>{{ getVoiceDisplayText(voice, selectAllVoices) }}</span>
                        </option>
                    </select>
                    <div class="four columns">
                        <input id="selectAllVoices" type="checkbox" v-model="selectAllVoices" @change="showAllVoicesChanged()"/>
                        <label for="selectAllVoices">{{ $t('showAllVoices') }}</label>
                    </div>
                </div>
                <div class="srow">
                    <label class="three columns" for="testText">
                        <span>{{ $t('testText') }}</span>
                    </label>
                    <input id="testText" class="five columns" type="text" v-model="testText">
                    <button id="testVoice" class="three columns" @click="testSpeak">{{ $t('test') }}</button>
                </div>
                <div class="srow">
                    <accordion :acc-label="$t('advancedVoiceSettings')" class="eleven columns">
                        <div v-if="userSettingsLocal.voiceConfig.preferredVoice">
                            <slider-input :label="$t('voicePitch')" id="voicePitch" min="0.1" max="2" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voicePitch" @change="saveUserSettingsLocal()"/>
                            <slider-input :label="$t('voiceRate')" id="voiceRate" min="0.1" max="10" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voiceRate" @change="saveUserSettingsLocal()"/>
                        </div>
                        <div class="srow">
                            <label class="three columns" for="inVoice2">
                                <span>{{ $t('secondVoice') }}</span>
                            </label>
                            <select id="inVoice2" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.secondVoice" @change="saveUserSettingsLocal()">
                                <option :value="undefined">{{ $t('noneSelected') }}</option>
                                <option v-for="voice in voices" :value="voice.id">
                                    <span>{{ getVoiceDisplayText(voice, true) }}</span>
                                </option>
                            </select>
                            <button id="testVoice2" class="three columns" :disabled="!userSettingsLocal.voiceConfig.secondVoice" @click="speechService.testSpeak(userSettingsLocal.voiceConfig.secondVoice)">{{ $t('test') }}</button>
                        </div>
                        <div class="srow">
                            <input id="voiceLangIsTextLang" type="checkbox" v-model="userSettingsLocal.voiceConfig.voiceLangIsTextLang" @change="saveUserSettingsLocal()"/>
                            <label for="voiceLangIsTextLang">{{ $t('linkVoiceLanguageToTranslationLanguageOfSpokenText') }}</label>
                        </div>
                        <div class="srow" v-show="!!speechService.getExternalVoice(userSettingsLocal.voiceConfig.preferredVoice)">
                            <button @click="cacheAll()" :disabled="externalVoiceCacheProgress !== undefined && externalVoiceCacheProgress !== 100">{{ $t('cacheAllTextsOfCurrentConfigurationExternalVoice') }}</button>
                            <span v-show="externalVoiceCacheProgress !== undefined"> ... {{ externalVoiceCacheProgress }}%</span>
                        </div>
                    </accordion>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService";
    import {dataService} from "../../../js/service/data/dataService";
    import HeaderIcon from '../../../vue-components/components/headerIcon.vue'
    import {speechService} from "../../../js/service/speechService";
    import {util} from "../../../js/util/util";
    import {localStorageService} from "../../../js/service/data/localStorageService";
    import {constants} from "../../../js/util/constants.js";
    import {MetaData} from "../../../js/model/MetaData.js";
    import Accordion from "../../components/accordion.vue";
    import {speechServiceExternal} from "../../../js/service/speechServiceExternal.js";
    import SliderInput from '../../modals/input/sliderInput.vue';
    import SettingsGeneral from './settingsGeneral.vue';
    import NavTabs from '../../components/nav-tabs.vue';
    import GlobalInputOptions from '../../modals/input/globalInputOptions.vue';
    import { gridUtil } from '../../../js/util/gridUtil';

    let KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";
    let KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";

    export default {
        components: { SettingsGeneral, NavTabs, SliderInput, GlobalInputOptions, Accordion, HeaderIcon},
        props: ["metadata", "userSettingsLocal"],
        data() {
            return {
                show: false,
                selectAllLanguages: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS)) || false,
                selectAllVoices: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_VOICES)) || false,
                gridLanguages: [],
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getAppLang(),
                saveSuccess: null,
                speechService: speechService,
                voices: [],
                selectVoices: [],
                validSpeechServiceUrl: null,
                externalVoiceCacheProgress: undefined,
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                MetaData: MetaData,
                util: util,
            }
        },
        computed: {
            selectLanguages() {
                if (!this.allLanguages || !this.gridLanguages) {
                    return []
                }
                if (this.selectAllLanguages) {
                    return this.allLanguages;
                }
                return this.allLanguages.filter(langObject => this.gridLanguages.includes(langObject.code));
            }
        },
        methods: {
            fixCurrentVoice(dontSave) {
                if (!this.selectVoices.map(v => v.id).includes(this.userSettingsLocal.voiceConfig.preferredVoice)) {
                    this.userSettingsLocal.voiceConfig.preferredVoice = undefined;
                    if (!dontSave) {
                        this.saveUserSettingsLocal();
                    }
                }
            },
            showAllVoicesChanged() {
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_VOICES, this.selectAllVoices);
            },
            showAllLangsChanged() {
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS, this.selectAllLanguages);
                if (!this.selectLanguages.map(e => e.code).includes(this.userSettingsLocal.contentLang)) {
                    this.userSettingsLocal.contentLang = undefined;
                    this.saveUserSettingsLocal();
                }
            },
            getSelectVoices() {
                if (!this.voices) {
                    return []
                }
                this.sortVoices();
                if (this.selectAllVoices) {
                    return this.voices;
                }
                return this.voices.filter(v => i18nService.getBaseLang(v.lang) === i18nService.getContentLangBase());
            },
            sortVoices() {
                this.voices.sort(speechService.voiceSortFn);
            },
            resetVoiceProps() {
                this.userSettingsLocal.voiceConfig.voicePitch = 1;
                this.userSettingsLocal.voiceConfig.voiceRate = 1;
            },
            async saveUserSettingsLocal(dontSaveSettings) {
                await i18nService.setContentLanguage(this.userSettingsLocal.contentLang, true);
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice(true);
                this.setVoiceTestText();
                if (!dontSaveSettings) {
                    localStorageService.saveUserSettings(this.userSettingsLocal);
                    this.saveSuccess = true;
                }
            },
            setVoiceTestText() {
                let voice = this.voices.filter(voice => voice.id === this.userSettingsLocal.voiceConfig.preferredVoice)[0];
                let voiceLang = voice ? voice.lang : i18nService.getContentLang();
                this.testText = i18nService.tl('thisIsAnEnglishSentence', [], i18nService.getBaseLang(voiceLang))
            },
            saveMetadata() {
                let thiz = this;
                this.saveSuccess = undefined;
                util.debounce(() => {
                    dataService.saveMetadata(thiz.metadata).then(() => {
                        this.saveSuccess = true;
                    });
                }, 250, 'SAVE_METADATA');
            },
            testSpeak() {
                speechService.speak(this.testText, {preferredVoice: this.userSettingsLocal.voiceConfig.preferredVoice});
            },
            getVoiceDisplayText(voice, allVoicesShown) {
                if (allVoicesShown) {
                    let lang = i18nService.te(`lang.${voice.lang}`) ? i18nService.t(`lang.${voice.lang}`) : voice.langFull;
                    return `${lang}: ${voice.name}, ${voice.local ? 'offline' : 'online'}`
                } else {
                    return `${voice.name}, ${voice.local ? 'offline' : 'online'}`
                }
            },
            async cacheAll() {
                let allGrids = await dataService.getGrids();
                let externalVoice = speechService.getExternalVoice(this.userSettingsLocal.voiceConfig.preferredVoice);
                speechServiceExternal.cacheAll(allGrids, externalVoice, (progress) => {
                    this.externalVoiceCacheProgress = progress;
                });
            }
        },
        async mounted() {
            let thiz = this;
            thiz.setVoiceTestText();
            let grids = await dataService.getGrids(false, true);
            thiz.gridLanguages = gridUtil.getGridsLangs(grids);
            thiz.voices = await speechService.getVoicesInitialized();
            thiz.selectVoices = thiz.getSelectVoices();
        }
    }
</script>

<style scoped>
    .fa-info-circle {
        color: #266697;
        margin-right: 0.5em;
    }
    .fa-check {
        color: green;
    }
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
</style>