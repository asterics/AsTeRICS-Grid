
<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('gridContentLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="contentLang">{{ $t('selectLanguage') }}</label>
                    <select class="five columns mb-2" id="contentLang" v-model="userSettingsLocal.contentLang" @change="saveUserSettings()">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="lang in selectLanguages" :key="lang.code" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
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
                    <label class="three columns" for="voiceProvider">
                        <span>{{ $t('voiceProvider') }}</span>
                    </label>
                    <select id="voiceProvider" class="five columns mb-2" v-model="selectedProvider" @change="onProviderChanged">
                        <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ getProviderLabel(provider) }}</option>
                    </select>
                    <div class="four columns">
                        <button class="full-width" :disabled="!providerNeedsConfiguration(selectedProvider)" @click="openProviderConfig">
                            <i class="fas fa-cog"></i> {{ $t('configure') }}
                        </button>
                    </div>
                </div>
                <div class="srow" v-if="providerNeedsConfiguration(selectedProvider) && !providerConfigured(selectedProvider)">
                    <span class="fa fa-exclamation-triangle warning-icon"></span>
                    <span>{{ $t('voiceProviderConfigurationMissing') }}</span>
                </div>
                <div class="srow">
                    <label class="three columns" for="inVoice">
                        <span>{{ $t('preferredVoice') }}</span>
                    </label>
                    <select id="inVoice" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.preferredVoice" @change="onVoiceChanged" :disabled="providerNeedsConfiguration(selectedProvider) && !providerConfigured(selectedProvider)">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="voice in selectVoices" :key="voice.id" :value="voice.id">
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
                            <slider-input :label="$t('voicePitch')" id="voicePitch" min="0.1" max="2" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voicePitch" @change="saveUserSettings()"/>
                            <slider-input :label="$t('voiceRate')" id="voiceRate" min="0.1" max="10" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voiceRate" @change="saveUserSettings()"/>
                        </div>
                        <div class="srow">
                            <label class="three columns" for="inVoice2">
                                <span>{{ $t('secondVoice') }}</span>
                            </label>
                            <select id="inVoice2" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.secondVoice" @change="saveUserSettings()">
                                <option :value="undefined">{{ $t('noneSelected') }}</option>
                                <option v-for="voice in voices" :key="voice.id" :value="voice.id">
                                    <span>{{ getVoiceDisplayText(voice, true) }}</span>
                                </option>
                            </select>
                            <button id="testVoice2" class="three columns" :disabled="!userSettingsLocal.voiceConfig.secondVoice" @click="speechService.testSpeak(userSettingsLocal.voiceConfig.secondVoice)">{{ $t('test') }}</button>
                        </div>
                        <div class="srow">
                            <input id="voiceLangIsTextLang" type="checkbox" v-model="userSettingsLocal.voiceConfig.voiceLangIsTextLang" @change="saveUserSettings()"/>
                            <label for="voiceLangIsTextLang">{{ $t('linkVoiceLanguageToTranslationLanguageOfSpokenText') }}</label>
                        </div>
                        <div class="srow" v-show="!!speechService.getExternalVoice(userSettingsLocal.voiceConfig.preferredVoice)">
                            <button @click="cacheAll()" :disabled="externalVoiceCacheProgress !== undefined && externalVoiceCacheProgress < 100">
                                <span v-if="externalVoiceCacheProgress === undefined">{{ $t('cacheAllTexts') }}</span>
                                <span v-else>{{ externalVoiceCacheProgress }}%</span>
                            </button>
                        </div>
                    </accordion>
                </div>
            </div>
        </div>
        <configure-voice-provider
            v-if="currentModal === MODALS.PROVIDER_CONFIG"
            :providers="providers"
            :selected-provider="selectedProvider"
            :settings="userSettingsLocal.voiceConfig.providerSettings"
            @validated="onProviderValidated"
            @close="closeProviderConfig"
        />
    </div>
</template>

<script>
    import { i18nService } from "../../../js/service/i18nService";
    import { dataService } from "../../../js/service/data/dataService";
    import { localStorageService } from "../../../js/service/data/localStorageService";
    import { speechService } from "../../../js/service/speechService";
    import { speechServiceExternal } from "../../../js/service/speechServiceExternal.js";
    import { util } from "../../../js/util/util";
    import { gridUtil } from '../../../js/util/gridUtil';
    import { constants } from "../../../js/util/constants.js";
    import { voiceProviderService } from "../../../js/service/voiceProviderService.js";
    import { settingsSaveMixin } from './settingsSaveMixin';
    import Accordion from "../../components/accordion.vue";
    import SliderInput from '../../modals/input/sliderInput.vue';
    import ConfigureVoiceProvider from '../../modals/voice-provider/configure-voice-provider.vue';

    const KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";
    const KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";
    const MODALS = { PROVIDER_CONFIG: 'PROVIDER_CONFIG' };

    export default {
        components: { SliderInput, Accordion, ConfigureVoiceProvider },
        props: ["userSettingsLocal", "metadata"],
        mixins: [settingsSaveMixin],
        data() {
            let selectAllLanguages = JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS)) || false;
            let selectAllVoices = JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_VOICES)) || false;
            let providers = voiceProviderService.getProviders();
            let selectedProvider = this.userSettingsLocal.voiceConfig.preferredProvider || constants.DEFAULT_VOICE_PROVIDER;
            if (!providers.some(provider => provider.id === selectedProvider)) {
                selectedProvider = constants.DEFAULT_VOICE_PROVIDER;
            }
            this.userSettingsLocal.voiceConfig.providerSettings = this.userSettingsLocal.voiceConfig.providerSettings || {};
            this.userSettingsLocal.voiceConfig.providerVoices = this.userSettingsLocal.voiceConfig.providerVoices || {};
            this.userSettingsLocal.voiceConfig.preferredProvider = selectedProvider;
            if (!this.userSettingsLocal.voiceConfig.preferredVoice && this.userSettingsLocal.voiceConfig.providerVoices[selectedProvider]) {
                this.userSettingsLocal.voiceConfig.preferredVoice = this.userSettingsLocal.voiceConfig.providerVoices[selectedProvider];
            }
            return {
                show: false,
                selectAllLanguages,
                selectAllVoices,
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
                util: util,
                lastSavedSettingsString: JSON.stringify(this.userSettingsLocal),
                providers,
                selectedProvider,
                currentModal: null,
                MODALS
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
            async loadVoices() {
                this.voices = await speechService.getVoicesInitialized();
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice(true);
                this.setVoiceTestText();
            },
            saveUserSettings() {
                if (JSON.stringify(this.userSettingsLocal) === this.lastSavedSettingsString) {
                    return;
                }
                this.$emit("changing");
                util.debounce(() => {
                    this.saveUserSettingsLocal(this.userSettingsLocal, 0);
                    this.lastSavedSettingsString = JSON.stringify(this.userSettingsLocal);
                    this.selectVoices = this.getSelectVoices();
                    this.fixCurrentVoice(true);
                    this.setVoiceTestText();
                }, 300, 'SAVE_USERSETTINGS');
            },
            fixCurrentVoice(dontSave) {
                if (!this.selectVoices.map(v => v.id).includes(this.userSettingsLocal.voiceConfig.preferredVoice)) {
                    this.userSettingsLocal.voiceConfig.preferredVoice = undefined;
                    this.updateProviderVoicePreference();
                    if (!dontSave) {
                        this.saveUserSettings();
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
                    this.saveUserSettings();
                }
            },
            getProviderVoices() {
                if (!this.voices) {
                    return [];
                }
                return this.voices.filter(voice => (voice.providerId || constants.VOICE_PROVIDER_SYSTEM) === this.selectedProvider);
            },
            getSelectVoices() {
                if (!this.voices) {
                    return [];
                }
                this.sortVoices();
                let providerVoices = this.getProviderVoices();
                if (this.selectAllVoices) {
                    return providerVoices;
                }
                return providerVoices.filter(v => i18nService.getBaseLang(v.lang) === i18nService.getContentLangBase());
            },
            sortVoices() {
                this.voices.sort(speechService.voiceSortFn);
            },
            resetVoiceProps() {
                this.userSettingsLocal.voiceConfig.voicePitch = 1;
                this.userSettingsLocal.voiceConfig.voiceRate = 1;
            },
            setVoiceTestText() {
                let voice = this.voices.find(voice => voice.id === this.userSettingsLocal.voiceConfig.preferredVoice);
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
            providerNeedsConfiguration(providerId) {
                let provider = this.providers.find(p => p.id === providerId);
                return provider ? voiceProviderService.providerRequiresConfig(provider) : false;
            },
            providerConfigured(providerId) {
                let provider = this.providers.find(p => p.id === providerId);
                if (!provider) {
                    return true;
                }
                if (!voiceProviderService.providerRequiresConfig(provider)) {
                    return true;
                }
                let settings = this.userSettingsLocal.voiceConfig.providerSettings || {};
                let providerSettings = settings[providerId] || {};
                return (provider.requiredConfig || []).every((key) => providerSettings[key]);
            },
            getProviderLabel(provider) {
                if (!provider) {
                    return '';
                }
                if (provider.labelKey && this.$te(provider.labelKey)) {
                    return this.$t(provider.labelKey);
                }
                return provider.id;
            },
            openProviderConfig() {
                this.currentModal = MODALS.PROVIDER_CONFIG;
            },
            closeProviderConfig() {
                this.currentModal = null;
            },
            async onProviderConfigSaved(payload) {
                const { providerId, settings } = payload;
                this.$set(this.userSettingsLocal.voiceConfig.providerSettings, providerId, settings);
                this.saveUserSettings();
                this.currentModal = null;
                await speechService.reinit();
                await this.loadVoices();
            },
            async onProviderValidated(payload) {
                const { providerId, settings } = payload;
                this.$set(this.userSettingsLocal.voiceConfig.providerSettings, providerId, settings);
                this.saveUserSettings();
                await speechService.reinit();
                await this.loadVoices();
            },
            onProviderChanged() {
                this.userSettingsLocal.voiceConfig.preferredProvider = this.selectedProvider;
                this.userSettingsLocal.voiceConfig.preferredVoice = this.userSettingsLocal.voiceConfig.providerVoices[this.selectedProvider];
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
                this.setVoiceTestText();
                this.saveUserSettings();
            },
            onVoiceChanged() {
                this.resetVoiceProps();
                this.updateProviderVoicePreference();
                this.setVoiceTestText();
                this.saveUserSettings();
            },
            updateProviderVoicePreference() {
                if (!this.userSettingsLocal.voiceConfig.providerVoices) {
                    this.$set(this.userSettingsLocal.voiceConfig, 'providerVoices', {});
                }
                if (this.userSettingsLocal.voiceConfig.preferredVoice) {
                    this.$set(this.userSettingsLocal.voiceConfig.providerVoices, this.selectedProvider, this.userSettingsLocal.voiceConfig.preferredVoice);
                } else if (this.userSettingsLocal.voiceConfig.providerVoices[this.selectedProvider]) {
                    this.$delete(this.userSettingsLocal.voiceConfig.providerVoices, this.selectedProvider);
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
            this.setVoiceTestText();
            let grids = await dataService.getGrids(false, true);
            this.gridLanguages = gridUtil.getGridsLangs(grids);
            await this.loadVoices();
        }
    }
</script>

<style scoped>
    .fa-info-circle {
        color: #266697;
        margin-right: 0.25em;
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
    .full-width {
        width: 100%;
    }
    .warning-icon {
        color: #d9534f;
        margin-right: 0.5em;
    }
</style>


