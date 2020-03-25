<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced" v-if="show">
            <div class="row">
                <h2 data-i18n="" class="six columns">General settings // Allgemeine Einstellungen</h2>
                <div v-if="saveSuccess" style="padding-top: 1.7em;"><i class="fas fa-check" style="color: green"></i> <span data-i18n="">All changes saved! // Alle Änderungen gespeichert!</span></div>
            </div>
            <div class="ten columns">
                <h3 data-i18n="">Language // Sprache</h3>
                <div class="row">
                    <label class="five columns" for="inLanguageCode">
                        <span data-i18n="">two-figure language code // zweistelliges Sprachkürzel</span>
                        <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes" target="_blank" data-i18n="">(ISO 639-1 list) // (ISO 639-1 Liste)</a>
                    </label>
                    <input id="inLanguageCode" class="six columns" v-model="langCode" type="text" maxlength="2" placeholder="empty = automatic" @input="saveLangCode()"/>
                </div>
                <div class="row" style="margin-bottom: 0.5em">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word" data-i18n="">
                        <span>For user interface only English ("en") and German ("de") are available. For all other languages English will be used.</span>
                        <span>Das User-Interface ist nur in Englisch ("en") and Deutsch ("de") verfügbar. Bei anderen Sprachen wird automatisch Englisch verwendet.</span>
                    </span>
                </div>
                <div class="row">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                        <span data-i18n="">
                            <span>In order to get the standard set of grids in the selected language go to <i>"Manage grids -> More -> Reset to default configuration"</i>. Supported language codes can found and added in the respective </span>
                            <span>Um die Standard-Gridsammlung in der entsprechenden Sprache zu erhalten, wählen Sie <i>"Grids verwalten -> Mehr -> Auf Standardkonfiguration zurücksetzen"</i>. Verfügbare Sprachkürzel können hier gefunden und erweitert werden: </span>
                        </span>
                    </span>
                    <a href="https://github.com/asterics/AsTeRICS-Grid/tree/master/app/examples/translations" target="_blank" data-i18n="">folder on github. // Ordner auf github</a>
                </div>
            </div>
            <div class="ten columns">
                <h3 data-i18n="">Voice // Stimme</h3>
                <div class="row">
                    <label class="three columns" for="inVoice">
                        <span data-i18n="">Preferred voice // Bevorzugte Stimme</span>
                    </label>
                    <select id="inVoice" class="five columns" v-model="selectedVoiceName" @change="saveVoice('saveVoice')">
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
                saveSuccess: null,
                speechService: speechService,
                syncNavigation: localStorageService.shouldSyncNavigation(),
                voices: speechService.getVoices(),
                selectedVoiceName: speechService.getPreferredVoiceName(),
                testText: i18nService.translate('This is an english sentence. // Das ist ein deutscher Satz.')
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
            testSpeak() {
                let voice = this.voices.filter(voice => voice.name === this.selectedVoiceName)[0];
                speechService.speak(this.testText, null , voice);
            }
        },
        mounted() {
            let thiz = this;
            i18nService.initDomI18n();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.show = true;
            });
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