<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('addMultipleGridItems') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="srow">
                            <label class="three columns" for="inputText">{{ $t('input') }}</label>
                            <span class="nine columns">{{ $t('insertLabelsForNewElements') }}</span>
                        </div>
                        <div class="srow">
                            <textarea v-focus class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;min-height: 70px;" placeholder="Element1;Element2;Element3;..."/>
                        </div>
                        <div class="srow">
                            <label class="three columns">{{ $t('recognizedElements') }}</label>
                            <div v-show="parsedElems.length > 0" class="nine columns">
                                <span>{{parsedElems.length}}</span>
                                <span>{{ $t('elementsBracket') }}</span>
                                <span class="break-word">{{JSON.stringify(parsedElems)}}</span>
                            </div>
                            <div v-show="parsedElems.length == 0" class="nine columns">
                                <span>{{ $t('noElements') }}</span>
                            </div>
                        </div>
                        <div class="srow">
                            <input id="addImages" type="checkbox" v-model="addImages">
                            <label for="addImages">{{ $t('automaticallyAddImages') }}</label>
                        </div>

                        <div v-if="addImages" class="srow">
                            <label class="three columns" for="searchProvider">{{ $t('searchProvider') }}</label>
                            <select class="nine columns" id="searchProvider" v-model="searchProvider" @change="searchProviderChanged">
                                <option v-for="provider in searchProviders" :key="provider.name" :value="provider">{{provider.name}}</option>
                            </select>
                        </div>

                        <div v-if="addImages && searchProvider && searchProvider.options" class="srow">
                            <accordion :header="$t('settingsForImageSearch')" :startOpen="false">
                                <div v-for="option in searchProvider.options" :key="option.name">
                                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.BOOLEAN">
                                        <input type="checkbox" :id="searchProvider.name + option.name" v-model="option.value"/>
                                        <label :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                                    </div>
                                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.SELECT">
                                        <label class="three columns" :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                                        <select class="nine columns" :id="searchProvider.name + option.name" v-model="option.value">
                                            <option :value="undefined">{{ $t('default') }}</option>
                                            <option v-for="opt in option.options" :key="opt" :value="opt">{{ $t(opt) }}</option>
                                        </select>
                                    </div>
                                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.MULTI_SELECT">
                                        <label class="three columns" :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                                        <div class="nine columns">
                                            <div v-for="opt in (option.options || [])" :key="opt.value" class="srow">
                                                <input type="checkbox"
                                                       :id="searchProvider.name + option.name + '_' + opt.value"
                                                       :value="opt.value"
                                                       :checked="isSymbolsetSelected(option, opt.value)"
                                                       @change="toggleSymbolsetSelection(option, opt.value)"/>
                                                <label :for="searchProvider.name + option.name + '_' + opt.value">{{ opt.label }}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </accordion>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="four columns" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="parsedElems.length == 0">
                                <i v-if="!loading" class="fas fa-check"/>
                                <i v-if="loading" class="fas fa-spinner fa-spin"/>
                                <span>{{ $t('insertElements') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import { gridUtil } from '../../js/util/gridUtil';
    import { util } from '../../js/util/util';
    import { arasaacService } from '../../js/service/pictograms/arasaacService';
    import { globalSymbolsService } from '../../js/service/pictograms/globalSymbolsService';
    import { openSymbolsService } from '../../js/service/pictograms/openSymbolsService';
    import { constants } from '../../js/util/constants';
    import Accordion from '../components/accordion.vue';

    export default {
        components: {Accordion},
        props: ['gridData', 'undoService'],
        data: function () {
            return {
                inputText: "",
                parsedElems: [],
                loading: false,
                addImages: true,
                searchProviders: [],
                searchProvider: null,
                constants: constants
            }
        },
        methods: {
            textChanged() {
                let text = this.inputText || '';
                if (util.isOnlyEmojis(text)) {
                    this.parsedElems = util.getEmojis(text);
                } else {
                    text = text.replace(/\n/gi, ';').replace(/;;/gi, ';');
                    this.parsedElems = text.split(';').map(el => el.trim()).filter(el => el.length > 0);
                }
            },
            async save () {
                var thiz = this;
                this.loading = true;
                this.$nextTick(async () => {
                    if (thiz.parsedElems.length === 0) return;
                    let gridDataObject = new GridData(this.gridData);
                    let freeCoordinates = gridUtil.getFreeCoordinates(this.gridData);
                    for (let label of this.parsedElems) {
                        if (freeCoordinates.length === 0) {
                            freeCoordinates = gridUtil.getFreeCoordinates(gridDataObject);
                        }
                        let position = freeCoordinates.shift();
                        if (!position) {
                            position = {
                                x: 0,
                                y: gridUtil.getHeightWithBounds(this.gridData)
                            };
                        }
                        let newElem = new GridElement({
                            label: i18nService.getTranslationObject(label),
                            x: position.x,
                            y: position.y,
                        });
                        if (thiz.addImages && thiz.searchProvider) {
                            let results = await thiz.searchProvider.service.query(label, thiz.searchProvider.options);
                            if (results.length > 0) {
                                newElem.image = results[0];
                            }
                        }
                        gridDataObject.gridElements.push(newElem);
                    }
                    await this.undoService.updateGrid(gridDataObject);
                    this.loading = false;
                    this.$emit('reload', gridDataObject);
                    this.$emit('close');
                });
            },
            triggerOptionsUpdate() {
                this.$set(this.searchProvider, 'options', JSON.parse(JSON.stringify(this.searchProvider.options)));
            },
            searchProviderChanged() {
                // Reset options when provider changes
                if (this.searchProvider && this.searchProvider.options) {
                    this.searchProvider.options.forEach(option => {
                        if (option.type === constants.OPTION_TYPES.MULTI_SELECT) {
                            option.value = []; // Empty array means all selected
                        }
                    });
                }

                // Dynamic load of GlobalSymbols symbol sets into MULTI_SELECT option
                if (this.searchProvider && this.searchProvider.name === globalSymbolsService.SEARCH_PROVIDER_NAME) {
                    let symbolsetOpt = (this.searchProvider.options || []).find(o => o.name === 'symbolsets');
                    if (symbolsetOpt && (!symbolsetOpt.options || symbolsetOpt.options.length === 0)) {
                        globalSymbolsService.getSymbolsetOptions().then(opts => {
                            symbolsetOpt.options = opts;
                            this.triggerOptionsUpdate();
                        });
                    }
                }
            },
            // For GlobalSymbols symbolsets and OpenSymbols repositories: empty array means "all selected"
            isSymbolsetSelected(option, value) {
                if (option.name !== 'symbolsets' && option.name !== 'repositories') {
                    return option.value && option.value.includes(value);
                }
                // For symbolsets and repositories: empty array means all are selected
                return !option.value || option.value.length === 0 || option.value.includes(value);
            },
            toggleSymbolsetSelection(option, value) {
                if (option.name !== 'symbolsets' && option.name !== 'repositories') {
                    // Regular multi-select behavior
                    if (!option.value) option.value = [];
                    const index = option.value.indexOf(value);
                    if (index > -1) {
                        option.value.splice(index, 1);
                    } else {
                        option.value.push(value);
                    }
                    return;
                }

                // Special logic for symbolsets and repositories
                if (!option.value || option.value.length === 0) {
                    // Currently "all selected" - clicking one item means deselect all others
                    option.value = option.options ? option.options.map(opt => opt.value).filter(v => v !== value) : [];
                } else {
                    // Some specific items selected
                    const index = option.value.indexOf(value);
                    if (index > -1) {
                        // Deselecting - remove from array
                        option.value.splice(index, 1);
                        // If we deselected everything, go back to "all selected" (empty array)
                        if (option.value.length === 0) {
                            option.value = [];
                        }
                    } else {
                        // Selecting - add to array
                        option.value.push(value);
                        // If we selected everything, go back to "all selected" (empty array)
                        if (option.options && option.value.length === option.options.length) {
                            option.value = [];
                        }
                    }
                }
            }
        },
        mounted() {
            // Initialize search providers
            this.searchProviders = [
                arasaacService.getSearchProviderInfo(),
                globalSymbolsService.getSearchProviderInfo(),
                openSymbolsService.getSearchProviderInfo()
            ];
            // Set ARASAAC as default for backward compatibility
            this.searchProvider = this.searchProviders[0];

            // Dynamic load of GlobalSymbols symbol sets into MULTI_SELECT option
            if (this.searchProvider && this.searchProvider.name === globalSymbolsService.SEARCH_PROVIDER_NAME) {
                let symbolsetOpt = (this.searchProvider.options || []).find(o => o.name === 'symbolsets');
                if (symbolsetOpt && (!symbolsetOpt.options || symbolsetOpt.options.length === 0)) {
                    globalSymbolsService.getSymbolsetOptions().then(opts => {
                        symbolsetOpt.options = opts;
                        this.triggerOptionsUpdate();
                    });
                }
            }

            // Set help location
            helpService.setHelpLocation('03_appearance_layout', '#adding-elements-and-layout-options');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }
</style>