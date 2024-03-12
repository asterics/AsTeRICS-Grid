<template>
    <div @dragenter="preventDefault" @dragover="preventDefault" @drop="imageDropped">
        <div class="srow">
            <label for="inputImg" class="two columns">{{ $t('image') }}</label>
            <button onclick="document.getElementById('inputImg').click();" class="three columns file-input">
                <input type="file" class="five columns" id="inputImg" @change="changedImg" accept="image/*"/>
                <span><i class="fas fa-file-upload"/> <span>{{ $t('chooseFile') }}</span></span>
            </button>
            <button class="three columns" @click="searchText = gridElement.label[i18nService.getContentLang()]; searchInput(0);">
                <i class="fas fa-search"></i>
                <span>{{ $t('searchByLabel') }}</span>
            </button>
            <button class="three columns" v-show="hasImage" @click="clearImage"><i class="fas fa-times"/> <span>{{ $t('clearImage') }}</span></button>
        </div>
        <div class="srow">
            <div class="img-preview-container offset-by-two four columns">
                <span class="show-mobile" v-show="!hasImage"><i class="fas fa-image"/> <span>{{ $t('noImageChosen') }}</span></span>
                <span class="hide-mobile" v-show="!hasImage"><i class="fas fa-arrow-down"/> <span>{{ $t('dropImageHere') }}</span></span>
                <div style="position: relative" class="u-full-width">
                    <img v-if="hasImage" class="img-preview" id="imgPreview" :src="gridElement.image.data || gridElement.image.url"/>
                    <img v-if="hasImage && gridElement.image.crossOut" style="position: absolute; left: 0" class="img-preview" src="app/img/cross-out.svg"/>
                </div>
                <div v-if="gridElement.image.author">
                    {{ $t('by') }} <a :href="gridElement.image.authorURL" target="_blank">{{gridElement.image.author}}</a>
                </div>
            </div>
            <div class="img-preview-container five columns hide-mobile" v-show="hasImage" style="margin-top: 50px;">
                <span><i class="fas fa-arrow-down"/> <span>{{ $t('dropNewImageHere') }}</span></span>
            </div>
        </div>
        <div class="srow" v-if="hasImage">
            <div class="eight columns offset-by-two">
                <input id="crossOut" type="checkbox" v-model="gridElement.image.crossOut"/>
                <label for="crossOut" style="font-weight: normal">Cross out image</label>
            </div>
        </div>
        <div class="srow mt-5">
            <label for="inputSearch" class="two columns">{{ $t('imageSearch') }}</label>
            <div class="five columns">
                <input id="inputSearch" type="text" v-model="searchText" @input="searchInput(500, $event)" :placeholder="'SEARCH_IMAGE_PLACEHOLDER' | translate"/>
                <button @click="clearSearch" :aria-label="$t('clear')"><i class="fas fa-times"></i></button>
            </div>
            <div class="four columns" v-if="searchProvider">
                <label for="searchProvider">{{ $t('searchProvider') }}</label>
                <select id="searchProvider" v-model="searchProvider" @change="searchInput(0); localStorageService.save(EDIT_ELEM_SELECTED_SEARCH_PROVIDER, searchProvider.name)">
                    <option v-for="provider in searchProviders" :value="provider">{{provider.name}}</option>
                </select>
                <a :href="searchProvider.url" target="_blank">{{ $t('moreInfo') }}</a>
            </div>
        </div>
        <div class="srow" v-if="searchProvider && (searchProvider.options || searchProvider.searchLangs)">
            <accordion class="offset-by-two ten columns" :acc-label="$t('settingsForImageSearch')" acc-label-type="span" acc-background-color="white">
                <div class="srow">
                    <label class="three columns" for="searchLang">{{$t('searchLang')}}</label>
                    <select class="five columns" id="searchLang" v-model="searchLang" @change="searchInput(0); localStorageService.saveJSON(EDIT_ELEM_SEARCH_LANG_PREFIX + searchProvider.name, searchLang)">
                        <option :value="null">{{ $t('automaticCurrentLanguage') }}</option>
                        <option v-for="value in searchProvider.searchLangs" :value="value">{{ $t('lang.' + value) }}</option>
                    </select>
                </div>
                <div v-for="option in searchProvider.options">
                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.BOOLEAN">
                        <input :id="searchProvider.name + option.name" type="checkbox" v-model="option.value" @input="searchInput(0)"/>
                        <label :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                    </div>
                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.COLOR">
                        <label class="three columns" :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                        <span class="two columns" v-if="!option.value">(transparent)</span>
                        <input ref="colorInput" :class="option.value ? 'two columns' : ''" :style="!option.value ? 'height: 1px; width: 1px; opacity: 0' : ''" :id="searchProvider.name + option.name" type="color" v-model="option.value" @input="searchInput(0)"/>
                        <input v-if="option.value" aria-hidden="true" disabled="true" :style="'height: 1px; width: 1px; opacity: 0'"/> <!-- just for styling reasons in order to keep position of other elements-->
                        <button class="mx-2" @click="$refs.colorInput[0].click()">{{ $t('chooseColor') }}</button>
                        <button class="mx-2" :disabled="!option.value" @click="option.value = undefined; searchInput(0);">{{$t('clear')}}</button>
                    </div>
                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.SELECT">
                        <label class="three columns" :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                        <select class="three columns" :id="searchProvider.name + option.name" v-model="option.value" @change="searchInput(0)">
                            <option :value="undefined">{{ $t('noneSelected') }}</option>
                            <option v-for="value in option.options" :value="value">{{ $t(value) }}</option>
                        </select>
                    </div>
                    <div class="srow" v-if="option.type === constants.OPTION_TYPES.SELECT_COLORS">
                        <label class="three columns" :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                        <div class="nine columns colorSelector">
                            <div class="inline">
                                <button :aria-label="$t('noneSelected')" @click="option.value = undefined; afterColorChange(); searchInput(0);" :aria-selected="option.value === undefined">{{$t('noneSelected')}}</button>
                            </div>
                            <div v-for="(color, index) in option.colors" class="inline">
                                <button :aria-label="option.options[index]" :title="option.colors[index]" @click="option.value = option.options[index]; afterColorChange(); searchInput(0);" :aria-selected="option.options[index] === option.value" :style="`background-color: ${color};`"></button>
                            </div>
                        </div>
                    </div>
                </div>
            </accordion>
        </div>
        <div class="srow">
            <div class="offset-by-two ten columns">
                <div v-for="imgElement in searchResults" class="inline">
                    <img v-if="imgElement.url" :src="imgElement.url" @click="gridElement.image = imgElement;" :title="$t('byAuthor', [imgElement.author])" width="60" height="60" class="inline img-result" role="button"/>
                </div>
                <div class="inline" v-show="searchResults && searchResults.length > 0 && hasNextChunk">
                    <button @click="searchMore" style="height: 60px; margin: 0 0 0 0.5em;; padding: 0.7em; float: left">
                        <i class="fas fa-plus"></i>
                        <span>{{ $t('more') }}</span>
                    </button>
                </div>
                <span v-show="searchLoading"><i class="fas fa-spinner fa-spin"></i> <span>{{ $t('searching') }}</span></span>
                <span v-show="searchError"><i class="fas fa-times"></i> <span>{{ $t('searchFailedMaybeNotConnectedToInternet') }}</span></span>
                <span v-show="!searchError && !searchLoading && searchResults && searchResults.length === 0">
                                    <span><b>{{ $t('noSearchResults') }}</b></span>
                                </span>
            </div>
        </div>
    </div>
</template>

<script>
    import {imageUtil} from './../../js/util/imageUtil';
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {util} from "../../js/util/util";
    import {constants} from "../../js/util/constants.js";
    import Accordion from "../components/accordion.vue";
    import {openSymbolsService} from "../../js/service/pictograms/openSymbolsService.js";
    import {arasaacService} from "../../js/service/pictograms/arasaacService.js";
    import {GridImage} from "../../js/model/GridImage.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";

    const EDIT_ELEM_SELECTED_SEARCH_PROVIDER = "AG_EDIT_ELEM_SELECTED_SEARCH_PROVIDER";
    const EDIT_ELEM_SEARCH_LANG_PREFIX = "EDIT_ELEM_SEARCH_LANG_";

    export default {
        props: ['gridElement', 'gridData', 'imageSearch'],
        components: {Accordion},
        computed: {
            hasImage: function () {
                return this.gridElement && this.gridElement.image && (this.gridElement.image.data || this.gridElement.image.url);
            }
        },
        data: function () {
            return {
                searchText: null,
                searchProviders: [arasaacService.getSearchProviderInfo(), openSymbolsService.getSearchProviderInfo()],
                searchProvider: null,
                searchResults: null,
                searchLoading: false,
                searchLang: null,
                searchError: false,
                hasNextChunk: true,
                constants: constants,
                i18nService: i18nService,
                localStorageService: localStorageService,
                EDIT_ELEM_SELECTED_SEARCH_PROVIDER: EDIT_ELEM_SELECTED_SEARCH_PROVIDER,
                EDIT_ELEM_SEARCH_LANG_PREFIX: EDIT_ELEM_SEARCH_LANG_PREFIX
            }
        },
        watch: {
            searchProvider: {
                handler(newValue, oldValue) {
                    let hasOptions = newValue && newValue.options;
                    if (hasOptions) {
                        if (this.gridElement.image && this.gridElement.image.url && this.gridElement.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME) {
                            let newUrl = arasaacService.getUpdatedUrl(this.gridElement.image.url, newValue.options);
                            if(newUrl !== this.gridElement.image.url) {
                                this.gridElement.image.url = newUrl;
                                this.gridElement.image.searchProviderOptions = newValue.options;
                            }
                        }
                    }
                },
                deep: true
            }
        },
        methods: {
            changedImg() {
                let thiz = this;
                thiz.clearImage();
                imageUtil.getBase64FromInput($('#inputImg')[0]).then(base64 => {
                    thiz.setBase64(base64);
                });
            },
            imageDropped(event) {
                let thiz = this;
                event.preventDefault();
                this.clearImage();
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    $('#inputImg')[0].files = event.dataTransfer.files;
                    this.changedImg();
                } else {
                    let url = event.dataTransfer.getData('URL');
                    imageUtil.urlToBase64(url).then(resultBase64 => {
                        thiz.setBase64(resultBase64);
                    });
                }
            },
            setBase64(base64) {
                if (!base64) {
                    return;
                }
                let thiz = this;
                if (base64.length > 50 * 1024) {
                    imageUtil.convertBase64(base64, 2 * thiz.elementW).then(newData => {
                        if (newData.length < base64.length) {
                            log.info(`converted image from ${Math.round(base64.length / 1024)}kB to ${Math.round(newData.length / 1024)}kB`);
                            thiz.gridElement.image.data = newData;
                        } else {
                            log.info(`converting resulted in bigger image (${Math.round(newData.length / 1024)}kB), using old image with ${Math.round(base64.length / 1024)}kB`);
                            thiz.gridElement.image.data = base64;
                        }
                    })
                } else {
                    log.debug(`image size is ${Math.round(base64.length / 1024)}kB`);
                    thiz.gridElement.image.data = base64;
                }
            },
            clearImage() {
                this.gridElement.image = JSON.parse(JSON.stringify(new GridImage()));
            },
            preventDefault(event) {
                event.preventDefault();
            },
            openHelp() {
                helpService.openHelp();
            },
            search(keyword) {
                this.searchText = keyword;
                this.searchInput(0);
            },
            afterColorChange() {
                this.$forceUpdate(); // get color change in search option working, if no searchText
                this.$set(this.searchProvider, 'options', JSON.parse(JSON.stringify(this.searchProvider.options))); // trigger watch for color change, don't know why it's needed
            },
            searchInput(debounceTime, event) {
                let thiz = this;
                thiz.searchError = false;
                thiz.searchText = event ? event.target.value : thiz.searchText;
                if (!thiz.searchText) {
                    return;
                }
                debounceTime = debounceTime === undefined ? 500 : debounceTime;
                thiz.searchResults = [];
                thiz.searchLoading = true;
                util.debounce(function () {
                    thiz.searchProvider.service.query(thiz.searchText, thiz.searchProvider.options, thiz.searchLang).then(resultList => {
                        thiz.processSearchResults(resultList);
                    }).catch(() => {
                        thiz.searchError = true;
                        thiz.searchLoading = false;
                    });
                }, debounceTime);
            },
            searchMore() {
                let thiz = this;
                thiz.searchProvider.service.nextChunk().then(resultList => {
                    thiz.processSearchResults(resultList);
                });
            },
            clearSearch() {
                this.searchLoading = false;
                this.searchResults = null;
                this.searchText = "";
            },
            processSearchResults(resultList) {
                let thiz = this;
                thiz.hasNextChunk = thiz.searchProvider.service.hasNextChunk();
                thiz.searchResults = thiz.searchResults.concat(resultList);
                thiz.searchLoading = false;
            }
        },
        mounted() {
            let hasSearchProvider = this.gridElement.image && this.gridElement.image.searchProviderName;
            let currentSearchProviderName = hasSearchProvider ? this.gridElement.image.searchProviderName : localStorageService.get(EDIT_ELEM_SELECTED_SEARCH_PROVIDER);
            let currentSearchOptions = hasSearchProvider ? this.gridElement.image.searchProviderOptions : null;
            this.searchProvider = this.searchProviders.filter(provider => provider.name === currentSearchProviderName)[0] || this.searchProviders[0];
            if (currentSearchOptions) {
                let currentNames = currentSearchOptions.map(e => e.name);
                for (let i = 0; i < this.searchProvider.options.length; i++) {
                    let index = currentNames.indexOf(this.searchProvider.options[i].name);
                    if (index > -1 && currentSearchOptions[index].value) {
                        this.searchProvider.options[i].value = currentSearchOptions[index].value;
                    }
                }
            }
            this.searchLang = localStorageService.getJSON(EDIT_ELEM_SEARCH_LANG_PREFIX + this.searchProvider.name);
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            let maxElementX = Math.max(...this.gridData.gridElements.map(e => e.x + 1));
            this.elementW = Math.round($('#grid-container')[0].getBoundingClientRect().width / maxElementX);
            if (this.imageSearch) {
                this.search(this.imageSearch);
            }
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .img-preview-container > span {
        border: 1px solid lightgray;
        padding: 0.3em;
        width: 150px;
    }

    .img-preview {
        width: 150px;
    }

    .img-result:hover {
        outline: 2px solid black;
    }

    .srow {
        margin-top: 1em;
    }

    .colorSelector button[aria-selected="true"] {
        outline: 5px dashed darkblue;
    }

    .colorSelector button {
        margin-right: 0.5em;
        padding: 0;
        line-height: 1em;
        height: 1.5em;
        width: 3.5em;
    }

    @media (max-width: 850px) {
        #inputSearch {
            width: 80%;
        }
    }
</style>