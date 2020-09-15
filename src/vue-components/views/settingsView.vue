<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced" v-if="show">
            <div class="row">
                <h2 data-i18n="" class="six columns">General settings // Allgemeine Einstellungen</h2>
                <div v-if="saveSuccess" style="padding-top: 1.7em;"><i class="fas fa-check" style="color: green"></i> <span data-i18n="">All changes saved! // Alle Änderungen gespeichert!</span></div>
            </div>
            <div class="ten columns">
                <h3 data-i18n="">Application Language // Anwendungs-Sprache</h3>
                <div class="row">
                    <label class="three columns" for="inLanguage" data-i18n="">Select language // Sprache wählen</label>
                    <select class="five columns" id="inLanguage" v-model="langCode" @input="saveLangCode()">
                        <option value="" data-i18n="">automatic // automatisch</option>
                        <option v-for="lang in allLanguages.filter(lang => ['de', 'en'].indexOf(lang.code) !== -1 || gridLanguages.indexOf(lang.code) !== -1)" :value="lang.code">{{lang | extractTranslation}} ({{lang.code}})</option>
                    </select>
                </div>
                <div class="row">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                        <span data-i18n="">
                            <span>Grids can be translated to every language. To add or edit a translation use "Edit grid -> More -> Translate Grid".</span>
                            <span>Grids können in alle Sprachen übersetzt werden. Um eine Übersetzung zu bearbeiten oder hinzuzufügen, verwenden Sie "Grid bearbeiten -> Mehr -> Grid übersetzen".</span>
                        </span>
                    </span>
                </div>
                <div class="row" style="margin-bottom: 0.5em">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word" data-i18n="">
                        <span>For user interface only English (en) and German (de) are available. For all other languages English will be used.</span>
                        <span>Das User-Interface ist nur in Englisch (en) and Deutsch (de) verfügbar. Für andere Sprachen wird Englisch verwendet.</span>
                    </span>
                </div>
            </div>
            <div class="ten columns">
                <h3 data-i18n="">Voice // Stimme</h3>
                <div class="row">
                    <label class="three columns" for="inVoice">
                        <span data-i18n="">Preferred voice // Bevorzugte Stimme</span>
                    </label>
                    <select id="inVoice" class="five columns" v-model="selectedVoiceName" @change="saveVoice()">
                        <option value="" data-i18n="">automatic // automatisch</option>
                        <option v-for="voice in voices" :value="voice.name">{{voice.name}}</option>
                    </select>
                </div>
                <div class="row">
                    <label class="three columns" for="inVoice">
                        <span data-i18n="">Test text // Test-Text</span>
                    </label>
                    <input class="five columns" type="text" v-model="testText">
                    <button id="testVoice" class="three columns" @click="testSpeak" data-i18n="">Test // Testen</button>
                </div>
            </div>
            <div class="ten columns">
                <h3 data-i18n="">Miscellaneous // Diverses</h3>
                <div class="row">
                    <input id="chkSyncNavigation" type="checkbox" v-model="syncNavigation" @change="saveSyncNavigation()"/>
                    <label for="chkSyncNavigation" data-i18n="">Synchronize navigation and locked/fullscreen state for online users // Navigation und Sperr- bzw. Vollbildstatus für online User synchronisieren</label>
                </div>
                <div class="row">
                    <label class="three columns" for="unlockPass" data-i18n="">Passcode for unlocking user interface (only numbers) // PIN um Oberfläche zu entsperren (nur Ziffern)</label>
                    <input class="five columns" id="unlockPass" type="number" v-model="unlockPasscode" @input="unlockPasscode = unlockPasscode.substring(0, 6); savePasscode()" :placeholder="i18nService.translate('(no passcode) // (kein PIN)')"/>
                    <button class="three columns" @click="unlockPasscode = null; savePasscode()" data-i18n="">Reset // Löschen</button>
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

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                metadata: null,
                show: false,
                langCode: '',
                gridLanguages: [],
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getBrowserLang(),
                saveSuccess: null,
                speechService: speechService,
                syncNavigation: localStorageService.shouldSyncNavigation(),
                unlockPasscode: localStorageService.getUnlockPasscode(),
                voices: speechService.getVoices(),
                selectedVoiceName: speechService.getPreferredVoiceName(),
                testText: i18nService.translate('This is an english sentence. // Das ist ein deutscher Satz.'),
                i18nService: i18nService
            }
        },
        methods: {
            saveLangCode() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    i18nService.setLanguage(this.langCode);
                    i18nService.initDomI18n();
                    this.saveSuccess = true;
                }, 300, 'SAVE_LANG');
            },
            saveVoice() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    speechService.setPreferredVoiceName(this.selectedVoiceName);
                    this.saveSuccess = true;
                }, 300, 'SAVE_VOICE');
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
            testSpeak() {
                speechService.speak(this.testText, null , this.selectedVoiceName);
            }
        },
        mounted() {
            let thiz = this;
            i18nService.initDomI18n();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.show = true;
            });
            dataService.getGrids(false, true).then(grids => {
                thiz.gridLanguages = grids[0] ? Object.keys(grids[0].label) : [];
            })
            thiz.langCode = i18nService.getCustomLanguage();
        },
        updated() {
            i18nService.initDomI18n();
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
    .row {
        margin-bottom: 1.5em;
    }
</style>