<template>
    <div>
        <div class="srow">
            <h3 class="six columns">{{ $t('selectedRadioStations') }}</h3>
            <button class="six columns" :disabled="gridData.webRadios.length === 0" @click="addAllRadioElements">{{ $t('createGridElementsForWebradios') }}</button>
        </div>
        <media-list v-model="gridData.webRadios"
                    img-prop="faviconUrl" id-prop="radioId" :label-fn="radio => radio.radioName"
                    :action-config-prop="{canSelect: false, canMoveUp: true, canRemove: true}"
                    :playingMedia="playingRadio"
                    @togglePlay="togglePlay">

        </media-list>
        <div v-if="gridData.webRadios.length === 0">{{ $t('noSelectedRadioStationsUseSearchBar') }}</div>

        <div class="srow">
            <h3 class="four columns mb-0">{{ $t('webradioSearch') }}</h3>
            <span id="poweredby" class="eight columns">
                <i18n path="radioSearchPoweredBy" tag="span">
                    <template v-slot:radioLink>
                        <a href="https://www.radio-browser.info/gui/#!/" target="_blank">radio-browser.info</a>
                    </template>
                </i18n>
            </span>
        </div>
        <div class="srow">
            <search-bar v-model="webradioSearch" @input="searchRadios" :debounce-time="500"></search-bar>
        </div>
        <div class="srow">
            <media-list :media-elems="webradioSearchResults"
                        v-model="gridData.webRadios"
                        img-prop="faviconUrl" id-prop="radioId" :label-fn="radio => radio.radioName"
                        @togglePlay="togglePlay"
                        :playingMedia="playingRadio"
                        :enableNext="hasMoreWebradios"
                        :enablePrev="webradioStartIndex !== 0"
                        @paginateNext="nextSearchResults()"
                        @paginatePrev="prevSearchResults()">
            </media-list>
            <div v-show="webradioSearchResults.length === 0 && webradioSearch && !webradioSearching && !webradioSearchError">{{ $t('noRadioStationsFoundTryAnOtherSearchTerm') }}</div>
            <div v-show="webradioSearchError"><span>{{ $t('searchingFailedNoConnectionToInternet') }}</span> <a href="javascript:;" @click="searchRadios">{{ $t('retry') }}</a></div>
            <div v-show="webradioSearching">{{ $t('searching') }} <i class="fas fa-spinner fa-spin"></i></div>
        </div>
    </div>
</template>

<script>
    import {webradioService} from "../../js/service/webradioService";
    import {i18nService} from "../../js/service/i18nService";
    import {GridData} from "../../js/model/GridData";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import {GridImage} from "../../js/model/GridImage";
    import {imageUtil} from "../../js/util/imageUtil";
    import MediaList from './media-list.vue';
    import SearchBar from './searchBar.vue';

    let WEBRADIO_LIMIT = 10;

    export default {
        components: { SearchBar, MediaList },
        props: {
            gridData: Object
        },
        data() {
            return {
                webradioSearchResults: [],
                webradioSearch: null,
                webradioStartIndex: 0,
                webradioSearching: false,
                webradioSearchError: false,
                hasMoreWebradios: false,
                playingRadio: null
            }
        },
        methods: {
            togglePlay(data) {
                this.playingRadio = webradioService.toggle(data);
            },
            addAllRadioElements() {
                if (!confirm(i18nService.t('thisActionAddsXNewElements', this.gridData.webRadios.length))) {
                    return;
                }
                let thiz = this;
                let promises = [];
                let promiseChain = Promise.resolve();
                thiz.gridData.webRadios.forEach((radio, index) => {
                    const makeNextPromise = (currentRadio) => () => {
                        let promise = imageUtil.urlToBase64(currentRadio.faviconUrl).then(base64 => {
                            let image = base64 ? new GridImage({data: base64}) : undefined;
                            let newElement = new GridData(thiz.gridData).getNewGridElement({
                                label: i18nService.getTranslationObject(currentRadio.radioName),
                                actions: [new GridActionWebradio({
                                    radioId: currentRadio.radioId,
                                    action: GridActionWebradio.WEBRADIO_ACTION_START
                                })],
                                image: image
                            });
                            thiz.gridData.gridElements.push(newElement);
                            return Promise.resolve();
                        });
                        return promise;
                    }
                    promiseChain = promiseChain.then(makeNextPromise(radio));
                });
            },
            searchRadios() {
                this.webradioStartIndex = 0;
                this.searchWebradiosInternal();
            },
            nextSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex += WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            prevSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex -= WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            searchWebradiosInternal() {
                let thiz = this;
                thiz.webradioSearching = true;
                thiz.webradioSearchError = false;
                webradioService.search(thiz.webradioSearch, WEBRADIO_LIMIT, thiz.webradioStartIndex).then(result => {
                    thiz.hasMoreWebradios = webradioService.hasMoreSearchResults();
                    thiz.webradioSearchResults = result;
                    thiz.webradioSearching = false;
                }).catch(error => {
                    thiz.webradioSearchError = true;
                    thiz.webradioSearching = false;
                });
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    @media (min-width: 850px) {
        #poweredby {
            margin-top: 1em;
        }
    }
</style>