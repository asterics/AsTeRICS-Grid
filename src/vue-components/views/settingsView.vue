<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <nav-tabs v-model="currentTab" @input="changingState = CHANGE_STATES.STATE_INITIAL" :tab-labels="Object.keys(TABS)"/>
        <div style="position: relative">
            <span style="position: absolute; right: 1em; top: 1em">
                <span v-if="changingState === CHANGE_STATES.STATE_CHANGING" class="fas fa-spin fa-spinner"/>
                <span v-if="changingState === CHANGE_STATES.STATE_CHANGED" class="fas fa-check"/>
            </span>
        </div>
        <div class="srow content spaced mt-4" v-if="show">
            <settings-general v-if="currentTab === TABS.TAB_GENERAL" :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings" @changing="onChanging" @changed="onChanged"/>
            <settings-language v-if="currentTab === TABS.TAB_LANGUAGE" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-appearance v-if="currentTab === TABS.TAB_APPEARANCE" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-input-methods v-if="currentTab === TABS.TAB_INPUTMETHODS" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-integrations v-if="currentTab === TABS.TAB_INTEGRATIONS" :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings" @changing="onChanging" @changed="onChanged"/>
        </div>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {dataService} from "../../js/service/data/dataService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {speechService} from "../../js/service/speechService";
    import {util} from "../../js/util/util";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {constants} from "../../js/util/constants.js";
    import {MetaData} from "../../js/model/MetaData.js";
    import {TextConfig} from "../../js/model/TextConfig.js";
    import Accordion from "../components/accordion.vue";
    import GlobalInputOptions from "../modals/input/globalInputOptions.vue";
    import SliderInput from "../modals/input/sliderInput.vue";
    import {arasaacService} from "../../js/service/pictograms/arasaacService.js";
    import {speechServiceExternal} from "../../js/service/speechServiceExternal.js";
    import { gridUtil } from '../../js/util/gridUtil';
    import NavTabs from '../components/nav-tabs.vue';
    import SettingsGeneral from './settings/settingsGeneral.vue';
    import SettingsLanguage from './settings/settingsLanguage.vue';
    import SettingsIntegrations from './settings/settingsIntegrations.vue';
    import SettingsAppearance from './settings/settingsAppearance.vue';
    import SettingsInputMethods from './settings/settingsInputMethods.vue';

    let KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";
    let KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";

    const TABS = {
        TAB_GENERAL: 'TAB_GENERAL',
        TAB_LANGUAGE: 'TAB_LANGUAGE',
        TAB_APPEARANCE: 'TAB_APPEARANCE',
        TAB_INPUTMETHODS: 'TAB_INPUTMETHODS',
        TAB_INTEGRATIONS: 'TAB_INTEGRATIONS'
    };

    const CHANGE_STATES = {
        STATE_INITIAL: 'STATE_INITIAL',
        STATE_CHANGING: 'STATE_CHANGING',
        STATE_CHANGED: 'STATE_CHANGED'
    };

    export default {
        components: { SettingsInputMethods, SettingsAppearance, SettingsIntegrations, SettingsLanguage, SettingsGeneral, NavTabs, SliderInput, GlobalInputOptions, Accordion, HeaderIcon},
        props: [],
        data() {
            return {
                metadata: null,
                show: false,
                selectAllLanguages: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS)) || false,
                selectAllVoices: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_VOICES)) || false,
                gridLanguages: [],
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getAppLang(),
                speechService: speechService,
                appSettings: localStorageService.getAppSettings(),
                userSettingsLocal: localStorageService.getUserSettings(),
                voices: [],
                selectVoices: [],
                externalVoiceCacheProgress: undefined,
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                MetaData: MetaData,
                TextConfig: TextConfig,
                arasaacService: arasaacService,
                util: util,
                TABS: TABS,
                currentTab: TABS.TAB_GENERAL,
                CHANGE_STATES: CHANGE_STATES,
                changingState: CHANGE_STATES.STATE_INITIAL
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
            onChanging() {
                this.changingState = CHANGE_STATES.STATE_CHANGING;
            },
            onChanged() {
                this.changingState = CHANGE_STATES.STATE_CHANGED;
            },
            async saveAppLang() {
                await i18nService.setAppLanguage(this.appSettings.appLang);
                this.allLanguages = i18nService.getAllLanguages();
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
            },
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

            setVoiceTestText() {
                let voice = this.voices.filter(voice => voice.id === this.userSettingsLocal.voiceConfig.preferredVoice)[0];
                let voiceLang = voice ? voice.lang : i18nService.getContentLang();
                this.testText = i18nService.tl('thisIsAnEnglishSentence', [], i18nService.getBaseLang(voiceLang))
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
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.setVoiceTestText();
                thiz.show = true;
            });
            let grids = await dataService.getGrids(false, true);
            thiz.gridLanguages = gridUtil.getGridsLangs(grids);
            thiz.voices = await speechService.getVoicesInitialized();
            thiz.selectVoices = thiz.getSelectVoices();
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
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