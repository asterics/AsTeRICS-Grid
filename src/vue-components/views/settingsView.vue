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
                        <select class="five columns" id="inLanguage" v-model="appLang" @change="saveAppLang()">
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
                        <input id="chkSyncNavigation" type="checkbox" v-model="syncNavigation" @change="saveSyncNavigation()"/>
                        <label for="chkSyncNavigation">{{ $t('synchronizeNavigationAndLockedState') }}</label>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="unlockPass">{{ $t('passcodeForUnlockingUserInterface') }}</label>
                        <input class="five columns" id="unlockPass" type="number" v-model="unlockPasscode" @input="unlockPasscode = unlockPasscode.substring(0, 6); savePasscode()" :placeholder="$t('noPasscodeBracket')"/>
                        <button class="three columns" @click="unlockPasscode = null; savePasscode()">{{ $t('reset') }}</button>
                    </div>
                </div>
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
                        <select class="five columns mb-2" id="contentLang" v-model="metadata.localeConfig.contentLang" @change="saveContentLang()">
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
                        <select id="inVoice" class="five columns mb-2" v-model="metadata.localeConfig.preferredVoice" @change="resetVoiceProps(); saveVoice()">
                            <option :value="undefined">{{ $t('automatic') }}</option>
                            <option v-for="voice in selectVoices" :value="voice.name">
                                <span v-if="!selectAllVoices">{{voice.name}}</span>
                                <span v-if="selectAllVoices">{{ $t(`lang.${voice.lang}`) }}: {{voice.name}}</span>
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
                            <div v-if="metadata.localeConfig.preferredVoice">
                                <slider-input :label="$t('voicePitch')" id="voicePitch" min="0.1" max="2" step="0.1" decimals="1" v-model.number="metadata.localeConfig.voicePitch" @change="saveVoice()"/>
                                <slider-input :label="$t('voiceRate')" id="voiceRate" min="0.1" max="10" step="0.1" decimals="1" v-model.number="metadata.localeConfig.voiceRate" @change="saveVoice()"/>
                            </div>
                            <div class="srow">
                                <label class="three columns" for="inVoice2">
                                    <span>{{ $t('secondVoice') }}</span>
                                </label>
                                <select id="inVoice2" class="five columns mb-2" v-model="metadata.localeConfig.secondVoice" @change="saveVoice()">
                                    <option :value="undefined">{{ $t('noneSelected') }}</option>
                                    <option v-for="voice in voices" :value="voice.name">{{ $t(`lang.${voice.lang}`) }}: {{voice.name}}</option>
                                </select>
                                <button id="testVoice2" class="three columns" :disabled="!metadata.localeConfig.secondVoice" @click="speechService.testSpeak(metadata.localeConfig.secondVoice)">{{ $t('test') }}</button>
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
        </div>
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
    import $ from "../../js/externals/jquery.js";

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
                appLang: '',
                gridLanguages: [],
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getAppLang(),
                saveSuccess: null,
                speechService: speechService,
                syncNavigation: localStorageService.shouldSyncNavigation(),
                unlockPasscode: localStorageService.getUnlockPasscode(),
                voices: speechService.getVoices(),
                selectVoices: [],
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                MetaData: MetaData,
                TextConfig: TextConfig
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
                await i18nService.setAppLanguage(this.appLang);
                this.allLanguages = i18nService.getAllLanguages();
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
            },
            async saveContentLang() {
                await i18nService.setContentLanguage(this.metadata.localeConfig.contentLang, true);
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice(true);
                this.saveMetadata();
            },
            fixCurrentVoice(dontSave) {
                if (!this.selectVoices.map(v => v.name).includes(this.metadata.localeConfig.preferredVoice)) {
                    this.metadata.localeConfig.preferredVoice = undefined;
                    this.saveVoice(true);
                    if (!dontSave) {
                        this.saveMetadata();
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
                if (!this.selectLanguages.map(e => e.code).includes(this.metadata.localeConfig.contentLang)) {
                    this.metadata.localeConfig.contentLang = undefined;
                    this.saveContentLang();
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
                this.voices.sort((a, b) => {
                    if (a.type !== b.type && a.lang === b.lang) {
                        if (a.type === speechService.VOICE_TYPE_NATIVE) return -1;
                        if (b.type === speechService.VOICE_TYPE_NATIVE) return 1;
                    }
                    let v1 = i18nService.t(`lang.${a.lang}`) + a.name;
                    let v2 = i18nService.t(`lang.${b.lang}`) + b.name;
                    return v1.localeCompare(v2);
                });
            },
            saveSyncNavigation() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    localStorageService.setShouldSyncNavigation(this.syncNavigation);
                    this.saveSuccess = true;
                }, 300, 'SAVE_NAV');
            },
            savePasscode() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    localStorageService.setUnlockPasscode(this.unlockPasscode);
                    this.saveSuccess = true;
                }, 500, 'SAVE_UNLOCK');
            },
            resetVoiceProps() {
                this.metadata.localeConfig.voicePitch = 1;
                this.metadata.localeConfig.voiceRate = 1;
            },
            saveVoice(dontSaveMetadata) {
                this.setVoiceTestText();
                if (!dontSaveMetadata) {
                    this.saveMetadata();
                }
            },
            setVoiceTestText() {
                let voice = this.voices.filter(voice => voice.name === this.metadata.localeConfig.preferredVoice)[0];
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
                speechService.speak(this.testText, {preferredVoice: this.metadata.localeConfig.preferredVoice});
            }
        },
        mounted() {
            let thiz = this;
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.metadata.localeConfig.contentLang = thiz.metadata.localeConfig.contentLang || undefined;
                thiz.metadata.localeConfig.voicePitch = thiz.metadata.localeConfig.voicePitch || 1;
                thiz.metadata.localeConfig.voiceRate = thiz.metadata.localeConfig.voiceRate || 1;
                thiz.setVoiceTestText();
                thiz.show = true;
            });
            dataService.getGrids(false, true).then(grids => {
                let languages = grids.reduce((total, grid) => {
                    //total = total.concat(Object.keys(grid.label));
                    return total.concat(grid.gridElements.reduce((t2, gridElem) => {
                        return t2.concat(Object.keys(gridElem.label));
                    }, []));
                }, []);
                thiz.gridLanguages = [...new Set(languages)];
            });
            thiz.appLang = i18nService.getCustomAppLang();
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