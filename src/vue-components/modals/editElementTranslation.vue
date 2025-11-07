<template>
    <div class="container-fluid px-0">
        <div class="srow" v-if="usedLocales.length > 0">
            <label class="four columns">{{ $t('selectAlreadyUsedLanguages') }}</label>
            <span class="eight columns">
                <button v-if="locale !== currentLocale" @click="chosenLocale = locale" v-for="locale in usedLocales" style="margin-right: 0.5em; padding: 0; line-height: 1;">{{getLocaleTranslation(locale)}}</button>
            </span>
        </div>
        <div class="srow" style="margin-top: 2em">
            <div class="six columns">
                <div class="srow" style="height: 2em;">
                    <strong>{{ $t('textsIn') }}</strong> <strong>{{currentLangTranslated}} ({{currentLocale}})</strong>
                </div>
            </div>
            <div class="six columns">
                <div class="srow">
                    <strong class="three columns">{{ $t('textsIn') }}</strong>
                    <select class="nine columns" v-model="chosenLocale">
                        <option v-for="lang in languagesToShow" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="srow label-section">
            <h3>{{ $t('label') }}</h3>
            <div class="row">
                <div class="six columns">
                    <input type="text"
                           :placeholder="`${currentLangTranslated}`"
                           class="u-full-width"
                           :lang="currentLocale"
                           v-model="gridElement.label[currentLocale]"/>
                </div>
                <div class="six columns">
                    <input type="text"
                           :placeholder="`${chosenLangTranslated}`"
                           class="u-full-width"
                           :lang="chosenLocale"
                           v-model="gridElement.label[chosenLocale]"/>
                </div>
            </div>
        </div>

        <div class="srow">
            <h3>{{ $t('pronunciation') }}</h3>
            <div class="row">
                <div class="six columns" style="position: relative">
                    <input type="text"
                           :placeholder="getPronunciationPlaceholder(currentLocale)"
                           class="u-full-width"
                           :lang="currentLocale"
                           v-model="gridElement.pronunciation[currentLocale]"/>
                    <button @click="speak(currentLocale)" class="input-button" :title="$t('testPronunciation')"><i class="fas fa-play"></i></button>
                </div>
                <div class="six columns" style="position: relative">
                    <input type="text"
                           :placeholder="getPronunciationPlaceholder(chosenLocale)"
                           class="u-full-width"
                           :lang="chosenLocale"
                           v-model="gridElement.pronunciation[chosenLocale]"/>
                    <button @click="speak(chosenLocale)" class="input-button" :title="$t('testPronunciation')"><i class="fas fa-play"></i></button>
                </div>
            </div>
        </div>

        <div class="srow" v-if="hasCustomSpeakActions">
            <h3>{{ `${$t('actions')} "${$t('GridActionSpeakCustom')}"` }}</h3>
            <div v-for="(action, index) in customSpeakActions" :key="index" class="row mb-2">
                <div class="six columns">
                    <input type="text"
                           :placeholder="`${currentLangTranslated}`"
                           class="u-full-width"
                           :lang="currentLocale"
                           v-model="action.speakText[currentLocale]"/>
                </div>
                <div class="six columns">
                    <input type="text"
                           :placeholder="`${chosenLangTranslated}`"
                           class="u-full-width"
                           :lang="chosenLocale"
                           v-model="action.speakText[chosenLocale]"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionSpeakCustom} from "../../js/model/GridActionSpeakCustom";
    import {speechService} from "../../js/service/speechService";
    import {dataService} from "../../js/service/data/dataService";
    import './../../css/modal.css';

    export default {
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                currentLocale: i18nService.getContentLang(),
                chosenLocale: i18nService.isCurrentContentLangEN() ? 'de' : 'en',
                allLanguages: i18nService.getAllLanguages(),
                usedLocales: []
            }
        },
        computed: {
            currentLangTranslated: function () {
                return this.getLocaleTranslation(this.currentLocale);
            },
            chosenLangTranslated: function () {
                return this.getLocaleTranslation(this.chosenLocale);
            },
            languagesToShow: function () {
                // If there are used locales, only show those (plus any not yet used)
                // This matches the behavior in settings
                if (this.usedLocales.length > 0) {
                    return this.allLanguages.filter(lang => {
                        return lang.code !== this.currentLocale &&
                               (this.usedLocales.includes(lang.code) || lang.code === this.chosenLocale);
                    });
                }
                // If no used locales yet, show all languages
                return this.allLanguages.filter(lang => lang.code !== this.currentLocale);
            },
            customSpeakActions: function () {
                if (!this.gridElement || !this.gridElement.actions) {
                    return [];
                }
                return this.gridElement.actions.filter(action =>
                    action.modelName === GridActionSpeakCustom.getModelName()
                );
            },
            hasCustomSpeakActions: function () {
                return this.customSpeakActions.length > 0;
            }
        },
        methods: {
            getPronunciationPlaceholder(locale) {
                let label = this.gridElement.label[locale] || "";
                return i18nService.t('pronunciationOf', label);
            },
            getLocaleTranslation(locale) {
                return i18nService.getTranslationAppLang(this.allLanguages.filter(lang => lang.code === locale)[0]);
            },
            speak(locale) {
                let speakText = this.gridElement.pronunciation[locale] || this.gridElement.label[locale];
                if (!speakText) {
                    return;
                }
                speechService.speak(speakText, {
                    lang: locale,
                    voiceLangIsTextLang: true
                });
            },
            findUsedLocales() {
                this.usedLocales = [];
                dataService.getGrids(true).then((grids) => {
                    for (let grid of grids) {
                        for (let element of grid.gridElements) {
                            for (let lang of Object.keys(element.label)) {
                                if (!this.usedLocales.includes(lang) && !!element.label[lang]) {
                                    this.usedLocales.push(lang);
                                }
                            }
                        }
                    }
                    this.usedLocales.sort((a, b) => this.getLocaleTranslation(a).localeCompare(this.getLocaleTranslation(b)));
                });
            }
        },
        mounted() {
            // Ensure gridElement has proper label and pronunciation structure
            if (!this.gridElement.label || typeof this.gridElement.label === 'string') {
                this.$set(this.gridElement, 'label', {});
            }
            if (!this.gridElement.pronunciation) {
                this.$set(this.gridElement, 'pronunciation', {});
            }

            // Ensure speakText is initialized for custom speak actions
            if (this.gridElement.actions) {
                this.gridElement.actions.forEach(action => {
                    if (action.modelName === GridActionSpeakCustom.getModelName() && !action.speakText) {
                        this.$set(action, 'speakText', {});
                    }
                });
            }

            this.findUsedLocales();
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    .label-section {
        margin-top: 2em;
    }

    h3 {
        font-weight: normal;
        font-size: 1.1em;
        margin-top: 1em;
        margin-bottom: 0.8em;
    }

    .input-button {
        position: absolute;
        right: 0;
        height: 100%;
        line-height: initial;
        margin: 0;
        padding: 0 1em;
        box-shadow: none;
        background-color: transparent;
    }
</style>
