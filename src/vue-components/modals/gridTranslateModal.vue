<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Translate Grids // Grids übersetzen
                        </h1>
                    </div>

                    <div class="modal-body" v-if="gridData !== undefined">
                        <div>
                            <div class="row">
                                <label class="four columns" for="gridSelect" data-i18n="">Grid to translate // Zu übersetzendes Grid</label>
                                <select class="four columns" id="gridSelect" v-model="gridData">
                                    <option :value="null" data-i18n="">show all Grids // alle Grids anzeigen</option>
                                    <option v-for="grid in allGrids" :value="grid">{{grid.label | extractTranslation}}</option>
                                </select>
                            </div>
                            <div class="row" v-if="usedLocales.length > 0">
                                <label class="four columns" data-i18n="">Select already used languages // Auswahl bereits verwendeter Sprachen</label>
                                <span class="six columns">
                                    <button v-if="locale !== currentLocale" @click="chosenLocale = locale" v-for="locale in usedLocales" style="margin-right: 0.5em">{{getLocaleTranslation(locale)}}</button>
                                </span>
                            </div>
                            <div class="row" style="margin-top: 2em">
                                <div class="six columns">
                                    <div class="row" style="height: 2em;">
                                        <strong data-i18n="">Texts in // Texte auf</strong> <strong>{{currentLangTranslated}} ({{currentLocale}})</strong>
                                    </div>
                                    <div class="row">
                                        <button class="six columns" @click="copy(currentLocale)" :title="'Copy Column // Spalte kopieren' | translate">
                                            <i class="far fa-copy"></i>
                                            <span class="show-mobile" data-i18n="">{{currentLangTranslated}} kopieren</span>
                                            <span class="hide-mobile" data-i18n="">Spalte kopieren</span>
                                        </button>
                                        <button class="six columns" @click="paste(currentLocale)" :title="'Paste // Einfügen' | translate">
                                            <i class="far fa-clipboard"></i>
                                            <span class="show-mobile" data-i18n="">{{currentLangTranslated}} einfügen</span>
                                            <span class="hide-mobile" data-i18n="">Spalte einfügen</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="six columns">
                                    <div class="row" style="height: 2em;">
                                        <strong data-i18n="">Texts in // Texte auf</strong>
                                        &nbsp;<select v-model="chosenLocale">
                                            <option v-for="lang in allLanguages.filter(lang => lang.code !== currentLocale)" :value="lang.code">{{lang | extractTranslation}} ({{lang.code}})</option>
                                        </select>
                                    </div>
                                    <div class="row">
                                        <button class="six columns" @click="copy(chosenLocale)" :title="'Copy Column // Spalte kopieren' | translate">
                                            <i class="far fa-copy"></i>
                                            <span class="show-mobile" data-i18n="">{{chosenLangTranslated}} kopieren</span>
                                            <span class="hide-mobile" data-i18n="">Spalte kopieren</span>
                                        </button>
                                        <button class="six columns" @click="paste(chosenLocale)" :title="'Paste // Einfügen' | translate">
                                            <i class="far fa-clipboard"></i>
                                            <span class="show-mobile" data-i18n="">{{chosenLangTranslated}} einfügen</span>
                                            <span class="hide-mobile" data-i18n="">Spalte einfügen</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="translationList">
                                <ul v-for="data in (gridData ? [gridData] : allGrids)">
                                    <li>
                                        <div class="row">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="data.label[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="data.label[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                    <li v-for="el in data.gridElements" v-if="showGridElements(data.label[currentLocale])">
                                        <div class="row" v-if="el.label[currentLocale] || el.label[chosenLocale]">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="el.label[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="el.label[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                    <li v-for="el in data.gridElements" v-if="showGridElements(data.label[currentLocale])">
                                        <div class="row" v-for="action in el.actions" v-if="action.modelName === GridActionSpeakCustom.getModelName() && (action.speakText[currentLocale] || action.speakText[chosenLocale])">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="action.speakText[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="action.speakText[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button class="three columns offset-by-six" @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button class="three columns" @click="save()" title="Keyboard: [Ctrl + Enter]">
                                <i class="fas fa-check"/> <span data-i18n>Save // Speichern</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {GridActionSpeakCustom} from "../../js/model/GridActionSpeakCustom";
    import {util} from "../../js/util/util";
    import {dataService} from "../../js/service/data/dataService";
    import {localStorageService} from "../../js/service/data/localStorageService";

    window.hideKeyboardTranslations = true;
    export default {
        props: ['gridDataId'],
        data: function () {
            return {
                gridData: undefined,
                allGrids: undefined,
                currentLocale: i18nService.getBrowserLang(),
                chosenLocale: i18nService.isBrowserLangEN() ? 'de' : 'en',
                GridActionSpeakCustom: GridActionSpeakCustom,
                allLanguages: i18nService.getAllLanguages(),
                usedLocales: localStorageService.getUsedLocales(),
                changedGrids: []
            }
        },
        computed: {
            currentLangTranslated: function () {
                return this.getLocaleTranslation(this.currentLocale);
            },
            chosenLangTranslated: function () {
                return this.getLocaleTranslation(this.chosenLocale);
            }
        },
        methods: {
            save() {
                let thiz = this;
                let data = thiz.gridData || thiz.allGrids[0];
                localStorageService.addUsedLocales(Object.keys(data.label));
                dataService.saveGrids(JSON.parse(JSON.stringify(thiz.changedGrids))).then(() => {
                    thiz.$emit('reload');
                    thiz.$emit('close');
                });
            },
            changedGrid(gridChanged) {
                if (!gridChanged) {
                    this.changedGrids = this.allGrids;
                } else if (this.changedGrids.indexOf(gridChanged) === -1) {
                    this.changedGrids.push(gridChanged);
                }
            },
            getLocaleTranslation(locale) {
                return i18nService.getTranslation(this.allLanguages.filter(lang => lang.code === locale)[0]);
            },
            copy(locale) {
                let result = $(`#translationList input[lang='${locale}']`).toArray();
                let text = result.reduce((total, current) => total + current.value + '\n', '');
                util.copyToClipboard(text);
            },
            paste(locale) {
                util.getClipboardContent().then(result => {
                    if (!result) {
                        return;
                    }
                    this.changedGrid(this.gridData);
                    let clipBoardTexts = result.trim().split('\n');
                    let elements = $(`#translationList input[lang='${locale}']`).toArray();
                    elements.forEach((el, index) => {
                        if (clipBoardTexts[index]) {
                            $(el).val(clipBoardTexts[index]);
                            $(el)[0].dispatchEvent(new Event('input'));
                        }
                    })
                })
            },
            showGridElements(label) {
                if (!window.hideKeyboardTranslations || this.gridData !== null) {
                    return true;
                }
                label = label.toLowerCase();
                return !label.includes('keyboard') && !label.includes('tastatur') && !label.includes('zahlen') && !label.includes('numbers');
            }
        },
        mounted() {
            dataService.getGrids(true).then((grids) => {
                this.allGrids = JSON.parse(JSON.stringify(grids));
                this.allGrids.sort((g1, g2) => i18nService.getTranslation(g1.label).localeCompare(i18nService.getTranslation(g2.label)));
                this.gridData = this.allGrids.filter(grid => grid.id === this.gridDataId)[0];
            });
            i18nService.initDomI18n();
        },
        updated() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }

    ul {
        list-style-type: none;
    }
</style>