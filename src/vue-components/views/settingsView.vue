<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced" v-if="show">
            <div class="srow" style="margin-bottom: 0">
                <h2 class="six columns">{{ $t('generalSettings') }}</h2>
                <div v-if="saveSuccess" style="padding-top: 1.7em;"><i class="fas fa-check" style="color: green"></i> <span>{{ $t('allChangesSaved') }}</span></div>
            </div>
            <div class="srow">
                <span class="fa fa-info-circle"></span>
                <span class="break-word">{{ $t('generalSettingsAreAppliedToAllUsersOnThisDevice') }}</span>
            </div>
            <div class="srow">
                <div class="eleven columns">
                    <h3 class="mt-2">{{ $t('applicationLanguage') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="inLanguage">{{ $t('selectLanguage') }}</label>
                        <select class="five columns" id="inLanguage" v-model="appSettings.appLang" @change="saveAppLang()">
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
                    <h3>{{ $t('miscellaneous') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="unlockPass">{{ $t('passcodeForUnlockingUserInterface') }}</label>
                        <input class="five columns" id="unlockPass" type="number" v-model="appSettings.unlockPasscode" @input="appSettings.unlockPasscode = appSettings.unlockPasscode.substring(0, 6); saveAppSettings()" :placeholder="$t('noPasscodeBracket')"/>
                        <button class="three columns" @click="appSettings.unlockPasscode = null; saveAppSettings()">{{ $t('reset') }}</button>
                    </div>
                </div>
            </div>
            <div class="srow">
                <accordion :acc-label="$t('advancedGeneralSettings')" class="eleven columns">
                    <div class="srow">
                        <input id="chkSyncNavigation" type="checkbox" v-model="appSettings.syncNavigation" @change="saveAppSettings()"/>
                        <label for="chkSyncNavigation">{{ $t('synchronizeNavigationAndLockedState') }}</label>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="externalSpeechUrl">{{ $t('externalSpeechUrl') }}</label>
                        <input type="text" id="externalSpeechUrl" class="seven columns" v-model="appSettings.externalSpeechServiceUrl" @input="saveAppSettings(reloadVoices)" placeholder="http://localhost:5555"/>
                        <span class="spaced" v-show="validSpeechServiceUrl === undefined"><i class="fas fa-spinner fa-spin"/></span>
                        <span class="spaced" v-show="validSpeechServiceUrl" style="color: green" :title="$t('urlIsValid')"><i class="fas fa-check"/></span>
                        <span class="spaced" v-show="validSpeechServiceUrl === false" style="color: red" :title="$t('urlIsInvalid')"><i class="fas fa-times"/></span>
                    </div>
                </accordion>
            </div>
            <div class="srow" style="margin-bottom: 0">
                <h2 class="six columns">{{ $t('userSettings') }}</h2>
            </div>
            <div class="srow">
                <span class="fa fa-info-circle"></span>
                <span class="break-word">{{ $t('userSettingsAreLinkedToTheCurrentUser') }}</span>
            </div>
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
            <div class="srow">
                <div class="eleven columns">
                    <h3 class="mt-2">{{ $t('colors') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="elemColor">
                            <span>{{ $t('defaultGridElementColor') }}</span>
                        </label>
                        <input id="elemColor" v-model="metadata.colorConfig.elementBackgroundColor" class="five columns" type="color" @change="saveMetadata()">
                        <button class="three columns" @click="metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR; saveMetadata()">{{ $t('reset') }}</button>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="appColor">
                            <span>{{ $t('defaultGridBackgroundColor') }}</span>
                        </label>
                        <input id="appColor" v-model="metadata.colorConfig.gridBackgroundColor" class="five columns" type="color" @change="saveMetadata()">
                        <button class="three columns" @click="metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR; saveMetadata()">{{ $t('reset') }}</button>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="colorScheme">
                            <span>{{ $t('colorSchemeForCategories') }}</span>
                        </label>
                        <select id="colorScheme" class="five columns" v-model="metadata.colorConfig.activeColorScheme" @change="saveMetadata()">
                            <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{scheme.name | translate}}</option>
                        </select>
                    </div>
                    <div class="srow">
                        <div class="five columns offset-by-three d-flex" style="height: 1.5em">
                            <div class="flex-grow-1" v-for="(color, index) in MetaData.getActiveColorScheme(metadata).colors" :title="$t(MetaData.getActiveColorScheme(metadata).categories[index])" :style="`background-color: ${color};`"></div>
                        </div>
                    </div>
                    <div class="srow">
                        <input id="colorSchemeActive" type="checkbox" v-model="metadata.colorConfig.colorSchemesActivated" @change="saveMetadata()"/>
                        <label for="colorSchemeActive">
                            <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="srow">
                <div class="eleven columns">
                    <h3 class="mt-2">{{ $t('generalInputSettings') }}</h3>
                    <global-input-options :input-config="metadata.inputConfig" heading-tag="h4" @change="saveMetadata()" :hide-acoustic-feedback="true"></global-input-options>
                </div>
            </div>
            <div class="srow">
                <div class="eleven columns">
                    <h3 class="mt-2">{{ $t('elementLabels') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="convertText">{{ $t('convertElementLabels') }}</label>
                        <select id="convertText" v-model="metadata.textConfig.convertMode" class="five columns" @change="saveMetadata()">
                            <option :value="null">{{ $t('dontConvertLabels') }}</option>
                            <option :value="TextConfig.CONVERT_MODE_UPPERCASE">{{ $t('convertToUppercasse') }}</option>
                            <option :value="TextConfig.CONVERT_MODE_LOWERCASE">{{ $t('convertToLowercase') }}</option>
                        </select>
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
                <div class="eleven columns">
                    <h3 class="mt-2">{{ $t('miscellaneous') }}</h3>
                    <div>
                        <input id="activateARASAACGrammarAPI" type="checkbox" v-model="metadata.activateARASAACGrammarAPI" @change="saveMetadata()"/>
                        <label for="activateARASAACGrammarAPI">
                            <i18n path="activateAutomaticGrammarCorrectionARASAACAPI" tag="span">
                                <template v-slot:availableLangs>
                                    <span>{{util.arrayToPrintable(arasaacService.getSupportedGrammarLangs(true))}}</span>
                                </template>
                            </i18n>
                        </label>
                    </div>
                    <div>
                        <span class="fa fa-info-circle"></span>
                        <span></span>
                        <i18n path="noteThatActivatingThisSendsSentencesToARASAACSeePrivacy" tag="span">
                            <template v-slot:link>
                                <a v-if="!i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_en.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a><a v-if="i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_de.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a>
                            </template>
                        </i18n>
                    </div>
                </div>
            </div>
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

    let KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";
    let KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";

    export default {
        components: {SliderInput, GlobalInputOptions, Accordion, HeaderIcon},
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
                saveSuccess: null,
                speechService: speechService,
                appSettings: localStorageService.getAppSettings(),
                userSettingsLocal: localStorageService.getUserSettings(),
                voices: [],
                selectVoices: [],
                validSpeechServiceUrl: null,
                externalVoiceCacheProgress: undefined,
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                MetaData: MetaData,
                TextConfig: TextConfig,
                arasaacService: arasaacService,
                util: util
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
                return this.voices.filter(v => v.lang === i18nService.getContentLang());
            },
            sortVoices() {
                this.voices.sort(speechService.voiceSortFn);
            },
            saveAppSettings(postFn) {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    localStorageService.saveAppSettings(this.appSettings);
                    this.saveSuccess = true;
                    if (postFn) {
                        postFn();
                    }
                }, 500, 'SAVE_APP_SETTINGS');
            },
            async reloadVoices() {
                this.validSpeechServiceUrl = undefined;
                this.validSpeechServiceUrl = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                let timeout = this.validSpeechServiceUrl ? 0 : 3000;
                util.debounce(async () => {
                    await speechService.reinit();
                    this.voices = speechService.getVoices();
                    this.selectVoices = this.getSelectVoices();
                }, timeout, 'RELOAD_VOICES');
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
                this.testText = i18nService.tl('thisIsAnEnglishSentence', [], voiceLang.substring(0, 2))
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
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.setVoiceTestText();
                thiz.show = true;
            });
            let grids = await dataService.getGrids(false, true);
            this.gridLanguages = gridUtil.getLanguages(grids);
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