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
                                <select class="four columns mb-2" id="gridSelect" v-model="gridData">
                                    <option :value="null">{{ $t('showAllGrids') }}</option>
                                    <option v-for="grid in allGrids" :value="grid">{{grid.label | extractTranslation}}</option>
                                </select>
                                <div class="four columns" v-if="!gridData">
                                    <input id="hideKeyboards" type="checkbox" v-model="hideKeyboards">
                                    <label for="hideKeyboards">{{ $t('hideKeyboards') }}</label>
                                </div>
                            </div>
                            <div class="srow">
                                <label class="four columns" for="translateType">{{ $t('whatToTranslate') }}</label>
                                <select class="four columns" id="translateType" v-model="translateType">
                                    <option v-for="type in TRANSLATE_TYPES" :value="type">{{ $t(type) }}</option>
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
                                        <button class="six columns" @click.exact="copy(currentLocale)" @click.ctrl.exact="copy(currentLocale, true)" :title="$t('copyColumn')">
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
                                        <button class="six columns" @click.exact="paste(currentLocale)" @click.ctrl.exact="paste(currentLocale, true)" :title="$t('pasteColumn')">
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
                                        <button class="six columns" @click.exact="copy(chosenLocale)" @click.ctrl.exact="copy(chosenLocale, true)" :title="$t('copyColumn')">
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
                                        <button class="six columns" @click.exact="paste(chosenLocale)" @click.ctrl.exact="paste(chosenLocale, true)" :title="$t('pasteColumn')">
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
                                <div v-if="gridsWithLabel.length > 0 && translateType === TRANSLATE_TYPES.ALL_TEXTS">
                                    <h2>{{ $t('nameOfGrid') }}</h2>
                                    <ul>
                                        <li v-for="data in gridsWithLabel">
                                            <div class="srow">
                                                <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" v-model="data.label[currentLocale]" @change="changedGrid(data)"/>
                                                <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" v-model="data.label[chosenLocale]" @change="changedGrid(data)"/>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="actionElems.length > 0 && translateType === TRANSLATE_TYPES.ALL_TEXTS">
                                    <h2>{{ `${$t('actions')} "${$t('GridActionSpeakCustom')}"` }}</h2>
                                    <ul>
                                        <li v-for="item in actionElems">
                                            <div class="srow" v-for="action in item.element.actions" v-if="action.modelName === GridActionSpeakCustom.getModelName()">
                                                <input type="text" :placeholder="`(${currentLangTranslated})`" class="six columns" :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[currentLocale]" @change="changedGrid(item.grid)"/>
                                                <input type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns" :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[chosenLocale]" @change="changedGrid(item.grid)"/>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="translateElements.length">
                                    <h2>{{ $t('elementsHeading') }}</h2>
                                    <ul>
                                        <li v-for="item in translateElements">
                                            <div class="srow">
                                                <div class="one columns">
                                                    <img height="25" style="max-width: 100%;" :src="item.element.image ? (item.element.image.url || item.element.image.data) : ''">
                                                </div>
                                                <input v-if="[TRANSLATE_TYPES.ALL_TEXTS, TRANSLATE_TYPES.ELEMENT_LABELS].includes(translateType)" type="text" :placeholder="`(${currentLangTranslated})`" class="five columns"
                                                       :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[currentLocale]" @change="changedGrid(item.grid)"/>
                                                <input v-if="[TRANSLATE_TYPES.ALL_TEXTS, TRANSLATE_TYPES.ELEMENT_LABELS].includes(translateType)" type="text" :placeholder="`(${chosenLangTranslated})`" class="six columns"
                                                       :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[chosenLocale]" @change="changedGrid(item.grid)"/>
                                                <div v-if="translateType === TRANSLATE_TYPES.ELEMENT_PRONUNCIATIONS" class="five columns" style="position: relative">
                                                    <input type="text" :placeholder="getPronunciationPlaceholder(item.element, currentLocale)" class="u-full-width"
                                                           :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element, 'pronunciation')" v-model="item.element.pronunciation[currentLocale]" @change="changedGrid(item.grid)"
                                                           :data-grid-id="item.grid.id" :data-element-id="item.element.id" :key="item.element.id"/>
                                                    <button @click="speak(item.element, currentLocale)" class="input-button"><i class="fas fa-play"></i></button>
                                                </div>
                                                <div v-if="translateType === TRANSLATE_TYPES.ELEMENT_PRONUNCIATIONS" class="six columns" style="position: relative">
                                                    <input type="text" :placeholder="getPronunciationPlaceholder(item.element, chosenLocale)" class="u-full-width"
                                                           :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element, 'pronunciation')" v-model="item.element.pronunciation[chosenLocale]" @change="changedGrid(item.grid)"
                                                           :data-grid-id="item.grid.id" :data-element-id="item.element.id" :key="item.grid.id + item.element.id"/>
                                                    <button @click="speak(item.element, chosenLocale)" class="input-button"><i class="fas fa-play"></i></button>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
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
    import { GridData } from '../../js/model/GridData';
    import { speechService } from '../../js/service/speechService';

    const TRANSLATE_TYPES = {
        ALL_TEXTS: "ALL_TEXTS",
        ELEMENT_LABELS: "ELEMENT_LABELS",
        ELEMENT_PRONUNCIATIONS: "ELEMENT_PRONUNCIATIONS"
    }

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
                usedLocales: [],
                changedGrids: [],
                hideKeyboards: true,
                originalElementInfo: {}, // grid-id + element-id => {label: originalLabelObject, hasImage: true/false}, tells if element should be shown in translate view
                translateType: TRANSLATE_TYPES.ALL_TEXTS,
                TRANSLATE_TYPES: TRANSLATE_TYPES
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
                if (!this.gridData && this.hideKeyboards) {
                    result = result.filter(data => data.grid.keyboardMode !== GridData.KEYBOARD_ENABLED);
                }
                result.sort((a, b) => {
                    if (this.originalHasLabel(a) && !this.originalHasLabel(b)) {
                        return -1;
                    }
                    if (!this.originalHasLabel(a) && this.originalHasLabel(b)) {
                        return 1;
                    }
                    if (a.grid.keyboardMode === GridData.KEYBOARD_ENABLED && b.grid.keyboardMode !== GridData.KEYBOARD_ENABLED) {
                        return 1;
                    }
                    if (a.grid.keyboardMode !== GridData.KEYBOARD_ENABLED && b.grid.keyboardMode === GridData.KEYBOARD_ENABLED) {
                        return -1;
                    }
                    return 0;
                });
                return result;
            },
            translateElements() {
                return this.allElements.filter(data => this.originalHasLabel(data) || this.originalHasImage(data));
            },
            actionElems() {
                return this.allElements.filter(data => data.element.actions.some(action => action.modelName === GridActionSpeakCustom.getModelName() && action.speakText[this.currentLocale]));
            },
            gridsWithLabel() {
                return this.selectedGrids.filter(grid => this.originalElementInfo[grid.id].label[this.currentLocale]);
            }
        },
        methods: {
            save() {
                let thiz = this;
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
            originalHasLabel(data) {
                return !!this.originalElementInfo[data.grid.id + data.element.id].label[this.currentLocale];
            },
            originalHasImage(data) {
                return this.originalElementInfo[data.grid.id + data.element.id].hasImage;
            },
            getPronunciationPlaceholder(gridElement, locale) {
                let label = gridElement.label[locale] || "";
                return i18nService.t('pronunciationOf', label);
            },
            getLocaleTranslation(locale) {
                return i18nService.getTranslationAppLang(this.allLanguages.filter(lang => lang.code === locale)[0]);
            },
            speak(element, locale) {
                let speakText = element.pronunciation[locale] || element.label[locale];
                speechService.speak(speakText, {
                    lang: locale,
                    voiceLangIsTextLang: true
                });
            },
            copy(locale, withKeys) {
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
                        text += elements[i].value + '\n';
                    }
                }
                util.copyToClipboard(text);
            },
            paste(locale, withKeys) {
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
                        let clipBoardTexts = result.trim().split('\n').map(e => e.trim());
                        let elements = $(`#translationList input[lang='${locale}']`).toArray();
                        let otherLocale = locale === this.currentLocale ? this.chosenLocale : this.currentLocale;
                        let elements2 = $(`#translationList input[lang='${otherLocale}']`).toArray();
                        for (let i = 0; i < elements.length; i++) {
                            let gridId = $(elements[i]).data('grid-id');
                            let elementId = $(elements[i]).data('element-id');
                            let element = this.getElement(gridId, elementId) || {};
                            let label = element.label || {};
                            let clipBoardText = clipBoardTexts[i] || "";
                            if (clipBoardText && (label[locale] !== clipBoardText)) {
                                $(elements[i]).val(clipBoardTexts[i]);
                                $(elements[i])[0].dispatchEvent(new Event('input'));
                            }
                        }
                    }
                })
            },
            getElement(gridId, elementId) {
                if (!gridId || !elementId) {
                    return null;
                }
                let grid = this.allGrids.find(g => g.id === gridId) || {};
                let elements = grid.gridElements || [];
                return elements.find(e => e.id === elementId);
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
                    this.originalElementInfo[gridData.id] = {
                        label: JSON.parse(JSON.stringify(gridData.label))
                    };
                    for (let element of gridData.gridElements) {
                        let hasImage = element.image && !!(element.image.url || element.image.data);
                        this.originalElementInfo[gridData.id + element.id] = {
                            label: JSON.parse(JSON.stringify(element.label)),
                            hasImage: hasImage
                        };
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