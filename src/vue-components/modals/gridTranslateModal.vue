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
                            <div class="srow mt-4" v-if="usedLocales.length > 0">
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
                                    <div class="srow">
                                        <button class="six columns" @click.exact="copy(currentLocale)" @click.ctrl.exact="copy(currentLocale, false, true)" @click.ctrl.shift.exact="copy(currentLocale, true, false)" :title="$t('copyColumn')">
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
                                        <button class="six columns" @click.exact="paste(currentLocale)" @click.ctrl.exact="paste(currentLocale, false, true)" @click.ctrl.shift.exact="paste(currentLocale, true)" :title="$t('pasteColumn')">
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
                                    <div class="srow">
                                        <strong class="three columns">{{ $t('textsIn') }}</strong>
                                        <select class="nine columns" v-model="chosenLocale">
                                            <option v-for="lang in allLanguages.filter(lang => lang.code !== currentLocale)" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                                        </select>
                                    </div>
                                    <div class="srow">
                                        <button class="six columns" @click.exact="copy(chosenLocale)" @click.ctrl.exact="copy(chosenLocale, false, true)" @click.ctrl.shift.exact="copy(chosenLocale, true, false)" :title="$t('copyColumn')">
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
                                        <button class="six columns" @click.exact="paste(chosenLocale)" @click.ctrl.exact="paste(chosenLocale, false, true)" @click.ctrl.shift.exact="paste(chosenLocale, true)" :title="$t('pasteColumn')">
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
                                <h2>{{ $t('nameOfGrid') }}</h2>
                                <ul>
                                    <li v-for="data in selectedGrids">
                                        <div class="srow">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="data.label[currentLocale]" @change="changedGrid(data)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="data.label[chosenLocale]" @change="changedGrid(data)"/>
                                        </div>
                                    </li>
                                </ul>
                                <h2>{{ $t('elementLabels') }}</h2>
                                <ul>
                                    <li v-for="item in allElements">
                                        <div v-if="showGridElements(item.grid) && shouldShowMap[item.element.id]" class="srow">
                                            <div class="one columns">
                                                <img height="25" style="max-width: 100%;" :src="item.element.image ? item.element.image.url || item.element.image.data : ''">
                                            </div>
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="five columns" :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[currentLocale]" @change="changedGrid(item.grid)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[chosenLocale]" @change="changedGrid(item.grid)"/>
                                        </div>
                                    </li>
                                </ul>
                                <h2 v-if="anyHasCustomSpeakAction">{{ `${$t('actions')} "${$t('GridActionSpeakCustom')}"` }}</h2>
                                <ul v-if="anyHasCustomSpeakAction">
                                    <li v-for="item in allElements" v-if="showGridElements(item.grid)">
                                        <div class="srow" v-for="action in item.element.actions" v-if="action.modelName === GridActionSpeakCustom.getModelName()">
                                            <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[currentLocale]" @change="changedGrid(item.grid)"/>
                                            <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[chosenLocale]" @change="changedGrid(item.grid)"/>
                                        </div>
                                    </li>
                                </ul>
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
                chosenLocale: i18nService.isCurrentContentLangEN() ? 'de' : 'en',
                GridActionSpeakCustom: GridActionSpeakCustom,
                allLanguages: i18nService.getAllLanguages(),
                usedLocales: localStorageService.getUsedLocales(),
                changedGrids: [],
                shouldShowMap: {} // element-id or action-id => boolean, tells if element should be shown in translate view
            }
        },
        computed: {
            currentLangTranslated: function () {
                return this.getLocaleTranslation(this.currentLocale);
            },
            chosenLangTranslated: function () {
                return this.getLocaleTranslation(this.chosenLocale);
            },
            selectedGrids() {
                if (!this.gridData && !this.allGrids) {
                    return [];
                }
                return this.gridData ? [this.gridData] : this.allGrids;
            },
            allElements() {
                let result = [];
                for (let grid of this.selectedGrids) {
                    result = result.concat(grid.gridElements.map(el => ({ element: el, grid: grid })));
                }
                return result;
            },
            anyHasCustomSpeakAction() {
                return this.allElements.some(item => item.element.actions.some(action => action.modelName === GridActionSpeakCustom.getModelName()));
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
            copy(locale, withKeys, onlyOtherEmpty) {
                let elements = $(`#translationList input[lang='${locale}']`).toArray();
                let text = null;
                if (withKeys) {
                    let array = elements.map(e => {
                        return {key: e.getAttribute('i18nid'), value: e.value}
                    }).filter(e => !!e.key);
                    text = JSON.stringify(array);
                } else {
                    let otherLocale = locale === this.currentLocale ? this.chosenLocale : this.currentLocale;
                    let elements2 = $(`#translationList input[lang='${otherLocale}']`).toArray();
                    text = '';
                    for (let i = 0; i < elements.length; i++) {
                        if (!onlyOtherEmpty || (elements[i].value && !elements2[i].value)) {
                            text += elements[i].value + '\n';
                        }
                    }
                }
                util.copyToClipboard(text);
            },
            paste(locale, withKeys, onlyEmpty) {
                util.getClipboardContent().then(result => {
                    if (!result) {
                        return;
                    }
                    this.changedGrid(this.gridData);
                    if (withKeys) {
                        let array = JSON.parse(result);
                        let counter = 0;
                        for (let pastedElement of array) {
                            let el = $(`#translationList input[i18nid='${pastedElement.key}'][lang='${locale}']`).toArray()[0];
                            if (el && pastedElement.value) {
                                $(el).val(pastedElement.value);
                                $(el)[0].dispatchEvent(new Event('input'));
                                counter++;
                            }
                        }
                        log.info(`inserted ${counter} (of ${array.length}) translations from json from clipboard.`);
                    } else {
                        let clipBoardTexts = result.trim().split('\n');
                        let elements = $(`#translationList input[lang='${locale}']`).toArray();
                        let otherLocale = locale === this.currentLocale ? this.chosenLocale : this.currentLocale;
                        let elements2 = $(`#translationList input[lang='${otherLocale}']`).toArray();
                        let clipBoardIndex = 0;
                        for (let i = 0; i < elements.length; i++) {
                            if ((!onlyEmpty || (!elements[i].value && elements2[i].value)) && clipBoardTexts[clipBoardIndex]) {
                                $(elements[i]).val(clipBoardTexts[clipBoardIndex]);
                                $(elements[i])[0].dispatchEvent(new Event('input'));
                                clipBoardIndex++;
                            }
                        }
                    }
                })
            },
            showGridElements(data) {
                let label = data.label[this.currentLocale] || data.label[Object.keys(data.label)[0]];
                if (!window.hideKeyboardTranslations || this.gridData !== null || !label) {
                    return true;
                }
                label = label.toLowerCase();
                return !label.includes('keyboard') && !label.includes('tastatur') && !label.includes('zahlen') && !label.includes('numbers');
            },
            getI18nId(gridData, gridElement, prefix) {
                prefix = prefix || '';
                let imageData = gridElement.image ? (gridElement.image.url || gridElement.image.data) : '';
                imageData = imageData || '';
                imageData = imageData.substring(0, 100);
                return btoa('' + gridData.gridElements.length + gridData.rowCount + gridData.minColumnCount + gridElement.x + gridElement.y + prefix + imageData);
            }
        },
        mounted() {
            dataService.getGrids(true).then((grids) => {
                this.allGrids = JSON.parse(JSON.stringify(grids));
                this.allGrids.sort((g1, g2) => i18nService.getTranslation(g1.label).localeCompare(i18nService.getTranslation(g2.label)));
                this.gridData = this.allGrids.filter(grid => grid.id === this.gridDataId)[0];
                for (let gridData of this.allGrids) {
                    for (let element of gridData.gridElements) {
                        let anyLabel = Object.keys(element.label).some(lang => !!element.label[lang]);
                        let hasImage = element.image && (element.image.url || element.image.data);
                        this.shouldShowMap[element.id] = anyLabel || hasImage;
                    }
                }
            });
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 0.5em;
    }

    ul {
        list-style-type: none;
    }

    h2 {
        font-weight: normal;
        font-size: 1.1em;
        margin-top: 1em;
        margin-bottom: 0.5em;
    }
</style>