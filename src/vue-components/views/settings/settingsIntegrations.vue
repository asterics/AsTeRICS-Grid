<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">ARASAAC</h3>
                <div>
                    <input id="activateARASAACGrammarAPI" type="checkbox" v-model="metadata.activateARASAACGrammarAPI" @change="saveMetadata(metadata)"/>
                    <label for="activateARASAACGrammarAPI">
                        <i18n path="activateAutomaticGrammarCorrectionARASAACAPI" tag="span">
                            <template v-slot:availableLangs>
                                <span>{{util.arrayToPrintable(arasaacService.getSupportedGrammarLangs(true))}}</span>
                            </template>
                        </i18n>
                    </label>
                </div>
                <div class="mt-3">
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
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">Pictogram Prediction</h3>
                <div class="srow">
                    <input id="showPictosInPredictions" type="checkbox" v-model="metadata.showPictogramsInPredictions" @change="saveMetadata(metadata)"/>
                    <label for="showPictosInPredictions">{{ $t('showPictogramsInPredictions') }}</label>
                </div>
                <div class="srow">
                    <input id="refreshPredictionsWhileTyping" type="checkbox" v-model="metadata.refreshPredictionsWhileTyping" @change="saveMetadata(metadata)"/>
                    <label for="refreshPredictionsWhileTyping">{{ $t('refreshPredictionsWhileTyping') }}</label>
                </div>
                <div class="srow">
                    <label class="three columns" for="pictoPredProvider">{{ $t('searchProvider') }}</label>
                    <select class="five columns" id="pictoPredProvider" v-model="metadata.pictogramPredictionProvider" @change="saveMetadata(metadata)">
                        <option value="GLOBALSYMBOLS">GlobalSymbols</option>
                        <option value="ARASAAC">ARASAAC</option>
                        <option value="OPENSYMBOLS">OpenSymbols</option>
                    </select>
                </div>
                <div class="srow">
                    <label class="three columns" for="pictoPredLang">{{ $t('searchLang') }}</label>
                    <select class="five columns" id="pictoPredLang" v-model="metadata.pictogramPredictionLang" @change="saveMetadata(metadata)">
                        <option :value="null">{{ $t('automaticCurrentLanguage') }}</option>
                        <option v-for="lang in i18nService.getAllLangCodes()" :value="lang">{{ $t('lang.' + lang) }}</option>
                    </select>
                </div>
            </div>
        </div>
        <h3>{{ $t('externalSpeechService') }}</h3>
        <div class="srow">
            <label class="three columns" for="externalSpeechUrl">{{ $t('externalSpeechUrl') }}</label>
            <input type="text" id="externalSpeechUrl" class="seven columns" v-model="appSettings.externalSpeechServiceUrl" @input="onSpeechUrlInput" placeholder="http://localhost:5555"/>
            <span class="spaced" v-show="urlValid === undefined"><i class="fas fa-spinner fa-spin"/></span>
            <span class="spaced" v-show="urlValid" style="color: green" :title="$t('urlIsValid')"><i class="fas fa-check"/></span>
            <span class="spaced" v-show="urlValid === false" style="color: red" :title="$t('urlIsInvalid')"><i class="fas fa-times"/></span>
        </div>
        <div class="mt-3">
            <span class="fa fa-info-circle"></span>
            <span></span>
            <i18n path="findDetailsAt" tag="span">
                <template v-slot:link>
                    <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid-Helper?tab=readme-ov-file#speech">{{ $t('infoAboutExternalSpeechService') }}</a>
                </template>
            </i18n>
        </div>
        <h3>{{ $t('Matrix messenger') }}</h3>
        <div class="srow">
            <button @click="currentModal = MODALS.MODAL_MATRIX"><i class="fas fa-cog"></i> Configure matrix messenger</button>
        </div>
        <configure-matrix v-if="currentModal === MODALS.MODAL_MATRIX" @close="currentModal = null"></configure-matrix>
    </div>
</template>

<script>
    import { i18nService } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import { speechServiceExternal } from '../../../js/service/speechServiceExternal';
    import { speechService } from '../../../js/service/speechService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import ConfigureMatrix from '../../modals/matrix-messenger/configure-matrix.vue';

    const MODAL_MATRIX = 'MODAL_MATRIX';
    const MODALS = { MODAL_MATRIX };

    export default {
        components: { ConfigureMatrix },
        props: ["metadata", "userSettingsLocal", "appSettings"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                i18nService: i18nService,
                util: util,
                arasaacService: arasaacService,
                urlValid: null,
                MODALS: MODALS,
                currentModal: null
            }
        },
        created() {
            // Ensure the label exists even if translation keys aren’t present
            if (!this.$te('refreshPredictionsWhileTyping')) {
                i18nService.addCustomTranslation('en', 'refreshPredictionsWhileTyping', 'Refresh predictions while typing');
            }
        },
        created() {
            // ensure default translation exists at runtime even if missing key; fallback to English string
            if (!this.$te('refreshPredictionsWhileTyping')) {
                i18n.addCustomTranslation('en', 'refreshPredictionsWhileTyping', 'Refresh predictions while typing');
            }
        },
        methods: {
            async onSpeechUrlInput() {
                let savedSomething = await this.saveAppSettings(this.appSettings);
                if (savedSomething) {
                    this.urlValid = undefined;
                    this.urlValid = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                    this.urlValid = this.appSettings.externalSpeechServiceUrl ? this.urlValid : null;
                    let timeout = this.urlValid ? 0 : 3000;
                    util.debounce(async () => {
                        await speechService.reinit();
                    }, timeout, 'REINIT_SPEECH');
                }
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