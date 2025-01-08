<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('applicationLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="inLanguage">{{ $t('selectLanguage') }}</label>
                    <select class="five columns" id="inLanguage" v-model="appSettings.appLang" @change="saveAppSettings(appSettings)">
                        <option value="">{{ $t('automatic') }}</option>
                        <option v-for="lang in allLanguages.filter(langObject => appLanguages.includes(langObject.code))" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                </div>
                <div class="srow" style="margin-bottom: 0.5em">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                    <i18n path="ifTheTranslationForYourLanguageIsNotAvailable" tag="span">
                        <template v-slot:crowdin>
                            <a href="https://crowdin.com/project/asterics-grid" target="_blank">crowdin.com</a>
                        </template>
                    </i18n>
                </span>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3>{{ $t('lockUserInterface') }}</h3>
                <div class="srow">
                    <label class="three columns" for="unlockPass">{{ $t('passcodeForUnlockingUserInterface') }}</label>
                    <input class="five columns" id="unlockPass" type="number" v-model="appSettings.unlockPasscode" @input="appSettings.unlockPasscode = appSettings.unlockPasscode.substring(0, 6); saveAppSettings(appSettings)" :placeholder="$t('noPasscodeBracket')"/>
                    <button class="three columns" @click="appSettings.unlockPasscode = null; saveAppSettings(appSettings)">{{ $t('reset') }}</button>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('notifications') }}</h3>
                <div>
                    <slider-input :label="'intervalForRemindingMakeBackups'" unit="days" id="backupReminderInterval" min="0" max="100" step="1" v-model.number="metadata.notificationConfig.backupNotifyIntervalDays" @change="saveMetadata()"/>
                </div>
            </div>
        </div>
        <div class="srow">
            <accordion :acc-label="$t('advancedGeneralSettings')" class="eleven columns">
                <div class="srow">
                    <input id="chkSyncNavigation" type="checkbox" v-model="appSettings.syncNavigation" @change="saveAppSettings(appSettings)"/>
                    <label for="chkSyncNavigation">{{ $t('synchronizeNavigationAndLockedState') }}</label>
                </div>
            </accordion>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService";
    import HeaderIcon from '../../../vue-components/components/headerIcon.vue'
    import {speechService} from "../../../js/service/speechService";
    import {util} from "../../../js/util/util";
    import {localStorageService} from "../../../js/service/data/localStorageService";
    import {constants} from "../../../js/util/constants.js";
    import {MetaData} from "../../../js/model/MetaData.js";
    import {TextConfig} from "../../../js/model/TextConfig.js";
    import Accordion from "../../components/accordion.vue";
    import {arasaacService} from "../../../js/service/pictograms/arasaacService.js";
    import {speechServiceExternal} from "../../../js/service/speechServiceExternal.js";
    import SliderInput from '../../modals/input/sliderInput.vue';
    import { settingsSaveMixin } from './settingsSaveMixin';

    export default {
        components: { SliderInput, Accordion, HeaderIcon},
        props: ["metadata", "appSettings", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                show: false,
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getAppLang(),
                saveSuccess: null,
                speechService: speechService,
                voices: [],
                selectVoices: [],
                validSpeechServiceUrl: null,
                externalVoiceCacheProgress: undefined,
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                MetaData: MetaData,
                TextConfig: TextConfig,
                arasaacService: arasaacService,
                util: util
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
            async reloadVoices() {
                this.validSpeechServiceUrl = undefined;
                this.validSpeechServiceUrl = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                let timeout = this.validSpeechServiceUrl ? 0 : 3000;
                util.debounce(async () => {
                    await speechService.reinit();
                    this.voices = speechService.getVoices();
                    //this.selectVoices = this.getSelectVoices();
                }, timeout, 'RELOAD_VOICES');
            },
            async saveUserSettingsLocal(dontSaveSettings) {
                await i18nService.setContentLanguage(this.userSettingsLocal.contentLang, true);
                //this.selectVoices = this.getSelectVoices();
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
                //this.testText = i18nService.tl('thisIsAnEnglishSentence', [], i18nService.getBaseLang(voiceLang))
            }
        },
        async mounted() {
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
</style>