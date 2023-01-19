<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('translateGrids') }}
                        </h1>
                    </div>

                    <div class="modal-body" v-if="gridData !== undefined">
                        <div>
                            <div class="srow">
                                <label class="four columns" for="gridSelect">{{ $t('gridToTranslate') }}</label>
                                <select class="four columns" id="gridSelect" v-model="gridData">
                                    <option :value="null">{{ $t('showAllGrids') }}</option>
                                    <option v-for="grid in allGrids" :value="grid">{{grid.label | extractTranslation}}</option>
                                </select>
                            </div>
                            <div class="srow" v-if="usedLocales.length > 0">
                                <label class="four columns">{{ $t('selectAlreadyUsedLanguages') }}</label>
                                <span class="six columns">
                                    <button v-if="locale !== currentLocale" @click="chosenLocale = locale" v-for="locale in usedLocales" style="margin-right: 0.5em">{{getLocaleTranslation(locale)}}</button>
                                </span>
                            </div>
                            <div class="srow" style="margin-top: 2em">
                                <div class="six columns">
                                    <div class="srow" style="height: 2em;">
                                        <strong>{{ $t('textsIn') }}</strong> <strong>{{currentLangTranslated}} ({{currentLocale}})</strong>
                                    </div>
                                    <div class="srow">
                                        <button class="six columns" @click="copy(currentLocale)" :title="$t('copyColumn')">
                                            <i class="far fa-copy"></i>
                                            <span class="show-mobile">
                                                <i18n path="copySomething" tag="span">
                                                    <template v-slot:toCopy>
                                                        {{currentLangTranslated}}
                                                    </template>
                                                </i18n>
                                            </span>
                                            <span class="hide-mobile">{{ $t('copyColumn') }}</span>
                                        </button>
                                        <button class="six columns" @click="paste(currentLocale)" :title="$t('pasteColumn')">
                                            <i class="far fa-clipboard"></i>
                                            <span class="show-mobile">
                                                <i18n path="pasteSomething" tag="span">
                                                    <template v-slot:toPaste>
                                                        {{currentLangTranslated}}
                                                    </template>
                                                </i18n>
                                            </span>
                                            <span class="hide-mobile">{{ $t('pasteColumn') }}</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="six columns">
                                    <div class="srow" style="height: 2em;">
                                        <strong>{{ $t('textsIn') }}</strong>
                                        &nbsp;<select v-model="chosenLocale">
                                            <option v-for="lang in allLanguages.filter(lang => lang.code !== currentLocale)" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                                        </select>
                                    </div>
                                    <div class="srow">
                                        <button class="six columns" @click="copy(chosenLocale)" :title="$t('copyColumn')">
                                            <i class="far fa-copy"></i>
                                            <span class="show-mobile">
                                                <i18n path="copySomething" tag="span">
                                                    <template v-slot:toCopy>
                                                        {{chosenLangTranslated}}
                                                    </template>
                                                </i18n>
                                            </span>
                                            <span class="hide-mobile">{{ $t('copyColumn') }}</span>
                                        </button>
                                        <button class="six columns" @click="paste(chosenLocale)" :title="$t('pasteColumn')">
                                            <i class="far fa-clipboard"></i>
                                            <span class="show-mobile">
                                                <i18n path="pasteSomething" tag="span">
                                                    <template v-slot:toPaste>
                                                        {{chosenLangTranslated}}
                                                    </template>
                                                </i18n>
                                            </span>
                                            <span class="hide-mobile">{{ $t('pasteColumn') }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="translationList">
                                <ul v-for="data in (gridData ? [gridData] : allGrids)">
                                    <li>
                                        <div class="srow">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="data.label[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="data.label[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                    <li v-for="el in data.gridElements" v-if="showGridElements(data.label[currentLocale])">
                                        <div class="srow" v-if="el.label[currentLocale] || el.label[chosenLocale]">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="el.label[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="el.label[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                    <li v-for="el in data.gridElements" v-if="showGridElements(data.label[currentLocale])">
                                        <div class="srow" v-for="action in el.actions" v-if="action.modelName === GridActionSpeakCustom.getModelName() && (action.speakText[currentLocale] || action.speakText[chosenLocale])">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="action.speakText[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="action.speakText[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                {{getElementCount()}} <span>{{ $t('elements') }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="three columns offset-by-six" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="three columns" @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('save') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
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
                currentLocale: i18nService.getContentLang(),
                chosenLocale: i18nService.isCurrentAppLangEN() ? 'de' : 'en',
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
                return i18nService.getTranslationAppLang(this.allLanguages.filter(lang => lang.code === locale)[0]);
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
            },
            getElementCount() {
                let array = this.gridData ? [this.gridData] : this.allGrids;
                return array.reduce((total, data) => total + data.gridElements.length, 0);
            }
        },
        mounted() {
            dataService.getGrids(true).then((grids) => {
                this.allGrids = JSON.parse(JSON.stringify(grids));
                this.allGrids.sort((g1, g2) => i18nService.getTranslation(g1.label).localeCompare(i18nService.getTranslation(g2.label)));
                this.gridData = this.allGrids.filter(grid => grid.id === this.gridDataId)[0];
            });
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    ul {
        list-style-type: none;
    }
</style>