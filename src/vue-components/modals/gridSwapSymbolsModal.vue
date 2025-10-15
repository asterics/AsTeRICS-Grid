<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="$emit('close')" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">{{ $t('swapSymbols') }}</h1>
                    </div>

                    <div class="modal-body" v-if="gridData !== undefined">
                        <div>
                            <div class="srow">
                                <label class="four columns" for="gridSelect">{{ $t('gridToSwapSymbols') }}</label>
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
                                <label class="four columns" for="searchProvider">{{ $t('searchProvider') }}</label>
                                <select class="four columns" id="searchProvider" v-model="searchProvider" @change="searchProviderChanged">
                                    <option v-for="provider in searchProviders" :key="provider.name" :value="provider">{{provider.name}}</option>
                                </select>
                                <button class="four columns small" @click="searchForAllSymbols" :disabled="!searchProvider">
                                    <i class="fas fa-sync"></i> {{ $t('refreshSymbols') }}
                                </button>
                            </div>
                            
                            <div v-if="searchProvider && searchProvider.options" class="srow">
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

                        <div class="srow">
                            <div class="twelve columns">
                                <div id="swapSymbolsList">
                                    <div v-for="item in elementsToShow" :key="item.grid.id + item.element.id" class="srow">
                                        <div class="one columns">
                                            <img height="25" style="max-width: 100%;" :src="item.element.image ? (item.element.image.url || item.element.image.data) : ''">
                                        </div>
                                        <div class="three columns">
                                            <strong>{{ item.element.label | extractTranslation }}</strong>
                                        </div>
                                        <div class="eight columns">
                                            <div v-if="item.searchResults && item.searchResults.length > 0" class="symbol-results">
                                                <div v-for="(result, index) in item.searchResults.slice(0, 5)" :key="index" class="symbol-option" @click="selectSymbol(item, result)">
                                                    <img :src="result.url || result.data" height="30" style="max-width: 50px; cursor: pointer; margin: 2px; border: 1px solid #ccc;">
                                                </div>
                                                <span v-if="item.searchResults.length > 5" class="more-results">
                                                    +{{ item.searchResults.length - 5 }} {{ $t('moreResults') }}
                                                </span>
                                            </div>
                                            <div v-else-if="item.searching" class="searching-indicator">
                                                <i class="fas fa-spinner fa-spin"></i> {{ $t('searching') }}...
                                            </div>
                                            <div v-else-if="item.searchResults && item.searchResults.length === 0" class="no-results">
                                                {{ $t('noResultsFound') }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="$emit('close')">
                                <i class="fas fa-times"></i>
                                <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" class="default">
                                <i class="fas fa-check"></i>
                                <span>{{ $t('ok') }}</span>
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
    import {dataService} from "../../js/service/data/dataService";
    import { GridData } from '../../js/model/GridData';
    import { arasaacService } from '../../js/service/pictograms/arasaacService';
    import { globalSymbolsService } from '../../js/service/pictograms/globalSymbolsService';
    import { openSymbolsService } from '../../js/service/pictograms/openSymbolsService';
    import { constants } from '../../js/util/constants';
    import Accordion from '../components/accordion.vue';

    export default {
        components: {Accordion},
        props: ['gridDataId'],
        data: function () {
            return {
                gridData: undefined,
                allGrids: undefined,
                changedGrids: [],
                hideKeyboards: true,
                originalElementInfo: {}, // grid-id + element-id => {hasImage: true/false}
                searchProviders: [],
                searchProvider: null,
                constants: constants,
                elementSearchData: {} // Store search results and state by element key
            }
        },
        watch: {
            gridData() {
                // When grid selection changes, search for all symbols again
                this.$nextTick(() => {
                    this.searchForAllSymbols();
                });
            }
        },
        computed: {
            elementsToShow() {
                let result = [];
                let gridsToShow = this.gridData ? [this.gridData] : this.allGrids;
                if (!gridsToShow) return result;
                
                for (let grid of gridsToShow) {
                    for (let element of grid.gridElements) {
                        if (this.originalElementInfo[grid.id + element.id] && this.originalElementInfo[grid.id + element.id].hasImage) {
                            if (!this.hideKeyboards || !element.type || element.type !== 'ELEMENT_TYPE_PREDICTION') {
                                const elementKey = grid.id + '_' + element.id;
                                const searchData = this.elementSearchData[elementKey] || {};

                                result.push({
                                    grid: grid,
                                    element: element,
                                    searchResults: searchData.searchResults || [],
                                    searching: searchData.searching || false
                                });
                            }
                        }
                    }
                }
                return result;
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
            async searchForSymbol(item) {
                const elementKey = item.grid.id + '_' + item.element.id;

                if (!this.searchProvider || !item.element.label) {
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: [],
                        searching: false
                    });
                    return;
                }

                let label = i18nService.getTranslation(item.element.label);
                if (!label) {
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: [],
                        searching: false
                    });
                    return;
                }

                // Clean up the label - remove common category words and make it more searchable
                let searchTerm = label.toLowerCase()
                    .replace(/\b(concepts?|activities?|set phrases?|shapes? and measures?|numbers?|hobbies?)\b/gi, '')
                    .replace(/[^\w\s]/g, '') // Remove special characters
                    .trim();

                // If the cleaned term is empty or too generic, try some fallback terms
                if (!searchTerm || searchTerm.length < 2) {
                    const fallbackTerms = {
                        'concepts': 'idea',
                        'activities': 'play',
                        'party': 'celebration',
                        'hobbies': 'hobby',
                        'numbers': 'number',
                        'shapes and measures': 'shape',
                        'set phrases': 'phrase',
                        'what': 'question',
                        'who': 'person',
                        'where': 'place',
                        'when': 'time',
                        'how': 'help',
                        'why': 'question'
                    };
                    searchTerm = fallbackTerms[label.toLowerCase()] || label.split(' ')[0] || 'symbol';
                }

                // Set searching state
                this.$set(this.elementSearchData, elementKey, {
                    searchResults: [],
                    searching: true
                });

                try {
                    // Add timeout to prevent hanging searches
                    const searchPromise = this.searchProvider.service.query(searchTerm, this.searchProvider.options);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Search timeout')), 10000)
                    );

                    let results = await Promise.race([searchPromise, timeoutPromise]);

                    // If no results with cleaned term, try original term
                    if (results.length === 0 && searchTerm !== label) {
                        const originalSearchPromise = this.searchProvider.service.query(label, this.searchProvider.options);
                        const originalTimeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Search timeout')), 10000)
                        );
                        results = await Promise.race([originalSearchPromise, originalTimeoutPromise]);
                    }

                    // Ensure results have the expected structure
                    const processedResults = results.slice(0, 10).map(result => {
                        // Ensure each result has a url or data property for the image
                        if (typeof result === 'string') {
                            return { url: result, data: result };
                        }
                        if (result.url || result.data) {
                            return result;
                        }
                        // Try to find image URL in common properties
                        const imageUrl = result.image || result.src || result.thumbnail || result.icon;
                        return { ...result, url: imageUrl, data: imageUrl };
                    });

                    // Set the results in the persistent data structure
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: processedResults,
                        searching: false
                    });
                } catch (error) {
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: [],
                        searching: false
                    });
                }
            },
            async searchForAllSymbols() {
                if (!this.searchProvider) {
                    return;
                }

                // Clear any existing search states first
                this.elementsToShow.forEach(item => {
                    const elementKey = item.grid.id + '_' + item.element.id;
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: [],
                        searching: false
                    });
                });

                // Search for elements in smaller batches to avoid overwhelming the API
                const batchSize = 5;
                for (let i = 0; i < this.elementsToShow.length; i += batchSize) {
                    const batch = this.elementsToShow.slice(i, i + batchSize);

                    const searchPromises = batch.map(item => this.searchForSymbol(item));
                    try {
                        await Promise.all(searchPromises);
                    } catch (error) {
                        // Silently handle batch errors
                    }

                    // Small delay between batches to be nice to the API
                    if (i + batchSize < this.elementsToShow.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            },
            selectSymbol(item, newSymbol) {
                // Update the element's image
                item.element.image = newSymbol;
                // Mark grid as changed
                this.changedGrid(item.grid);
                // Clear search results
                this.$set(item, 'searchResults', []);
            },
            async searchProviderChanged() {
                if (!this.searchProvider) return;

                // Reset options when provider changes
                if (this.searchProvider.options) {
                    this.searchProvider.options.forEach(option => {
                        if (option.type === constants.OPTION_TYPES.MULTI_SELECT) {
                            option.value = []; // Empty array means all selected
                        }
                    });
                }

                // Dynamic load of GlobalSymbols symbol sets into MULTI_SELECT option
                if (this.searchProvider.name === globalSymbolsService.SEARCH_PROVIDER_NAME) {
                    let symbolsetOpt = (this.searchProvider.options || []).find(o => o.name === 'symbolsets');
                    if (symbolsetOpt && (!symbolsetOpt.options || symbolsetOpt.options.length === 0)) {
                        try {
                            const opts = await globalSymbolsService.getSymbolsetOptions();
                            symbolsetOpt.options = opts;
                            this.triggerOptionsUpdate();
                        } catch (error) {
                            // Silently handle error
                        }
                    }
                }

                // Clear existing results first
                this.elementsToShow.forEach(item => {
                    const elementKey = item.grid.id + '_' + item.element.id;
                    this.$set(this.elementSearchData, elementKey, {
                        searchResults: [],
                        searching: false
                    });
                });

                // Wait a bit for UI to update, then search
                await this.$nextTick();
                setTimeout(() => {
                    this.searchForAllSymbols();
                }, 100);
            },
            triggerOptionsUpdate() {
                this.$set(this.searchProvider, 'options', JSON.parse(JSON.stringify(this.searchProvider.options)));
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
        async mounted() {
            // Initialize search providers
            this.searchProviders = [
                arasaacService.getSearchProviderInfo(),
                globalSymbolsService.getSearchProviderInfo(),
                openSymbolsService.getSearchProviderInfo()
            ];
            // Set ARASAAC as default
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

            // Load grids and element info
            this.allGrids = await dataService.getGrids(true);
            if (this.gridDataId) {
                this.gridData = this.allGrids.filter(g => g.id === this.gridDataId)[0];
            }
            
            // Build original element info
            for (let grid of this.allGrids) {
                for (let element of grid.gridElements) {
                    this.originalElementInfo[grid.id + element.id] = {
                        hasImage: !!(element.image && (element.image.url || element.image.data))
                    };
                }
            }

            // Automatically search for all symbols when modal opens
            // Wait a bit for the UI to fully render
            await this.$nextTick();
            setTimeout(() => {
                this.searchForAllSymbols();
            }, 200);
        }
    }
</script>

<style scoped>
    .symbol-results {
        margin-top: 5px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
    
    .symbol-option {
        display: inline-block;
    }
    
    .symbol-option img:hover {
        border-color: #007bff !important;
        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
    }
    
    .more-results {
        font-size: 0.8em;
        color: #666;
        margin-left: 5px;
    }
    
    .srow {
        margin-bottom: 10px;
    }
</style>
