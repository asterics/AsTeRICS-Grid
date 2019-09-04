<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced" v-if="show">
            <h2 data-i18n="">General settings // Allgemeine Einstellungen</h2>
            <div class="ten columns">
                <h3 data-i18n="">Language // Sprache</h3>
                <div class="row">
                    <label class="four columns" for="inLanguageCode">
                        <span data-i18n="">two-figure language code // zweistelliges Sprachkürzel</span>
                        <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes" target="_blank" data-i18n="">(ISO 639-1 list) // (ISO 639-1 Liste)</a>
                    </label>
                    <input id="inLanguageCode" class="four columns" v-model="langCode" type="text" maxlength="2" placeholder="empty = automatic" @input="saveSuccess = null"/>
                    <button id="saveLangCode" class="two columns" @click="saveLangCode('saveLangCode')">
                        <span v-show="saveSuccess !== 'saveLangCode'" data-i18n="">Save // Speichern</span><span v-show="saveSuccess === 'saveLangCode'" data-i18n="">Saved // Gespeichert</span> <i v-show="saveSuccess === 'saveLangCode'" class="fas fa-check"></i>
                    </button>
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
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {dataService} from "../../js/service/data/dataService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                metadata: null,
                show: false,
                langCode: '',
                saveSuccess: null
            }
        },
        methods: {
            saveLangCode(id) {
                i18nService.setLanguage(this.langCode);
                i18nService.initDomI18n();
                this.saveSuccess = id;
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