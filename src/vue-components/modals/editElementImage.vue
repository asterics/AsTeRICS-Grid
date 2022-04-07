<template>
    <div @dragenter="preventDefault" @dragover="preventDefault" @drop="imageDropped">
        <div class="srow">
            <label for="inputImg" class="two columns">{{ $t('image') }}</label>
            <button onclick="document.getElementById('inputImg').click();" class="five columns file-input">
                <input type="file" class="five columns" id="inputImg" @change="changedImg" accept="image/*"/>
                <span><i class="fas fa-file-upload"/> <span>{{ $t('chooseFile') }}</span></span>
            </button>
            <button class="five columns" v-show="gridElement.image.data" @click="clearImage"><i class="fas fa-times"/> <span>{{ $t('clearImage') }}</span></button>
        </div>
        <div class="srow">
            <div class="img-preview offset-by-two four columns">
                <span class="show-mobile" v-show="!gridElement.image.data"><i class="fas fa-image"/> <span>{{ $t('noImageChosen') }}</span></span>
                <span class="hide-mobile" v-show="!gridElement.image.data"><i class="fas fa-arrow-down"/> <span>{{ $t('dropImageHere') }}</span></span>
                <img v-if="gridElement.image.data" id="imgPreview" :src="gridElement.image.data"/>
                <div v-if="gridElement.image.data && gridElement.image.author">
                    {{ $t('by') }} <a :href="gridElement.image.authorURL" target="_blank">{{gridElement.image.author}}</a>
                </div>
            </div>
            <div class="img-preview five columns hide-mobile" v-show="gridElement.image.data" style="margin-top: 50px;">
                <span><i class="fas fa-arrow-down"/> <span>{{ $t('dropNewImageHere') }}</span></span>
            </div>
        </div>
        <div class="srow">
            <label for="inputSearch" class="two columns">{{ $t('imageSearch') }}</label>
            <div class="five columns">
                <input id="inputSearch" type="text" v-model="searchText" @input="searchInput(500, $event)" :placeholder="'SEARCH_IMAGE_PLACEHOLDER' | translate"/>
                <button @click="clearSearch" :aria-label="$t('clear')"><i class="fas fa-times"></i></button>
            </div>
            <span class="four columns">
                                <i18n path="searchPoweredBy" tag="span">
                                    <template v-slot:opensymbolsLink>
                                        <a href="https://www.opensymbols.org/" target="_blank">opensymbols.org</a>
                                    </template>
                                </i18n>
                            </span>
        </div>
        <div class="srow">
            <div class="offset-by-two ten columns">
                <div v-for="imgElement in searchResults" class="inline">
                    <img v-if="imgElement.base64" :src="imgElement.base64" @click="setImage(imgElement)" :title="$t('byAuthor', [imgElement.author])" width="60" height="60" class="inline" role="button"/>
                    <span v-if="!imgElement.base64 && !imgElement.failed" style="position: relative">
                                        <img src="data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" :title="imgElement.image_url" width="60" height="60" class="inline"/>
                                        <i class="fas fa-spinner fa-spin" style="position: absolute; top: -25px; left: 25px;"></i>
                                    </span>
                </div>
                <div class="inline" v-show="searchResults && searchResults.length > 0 && hasNextChunk">
                    <button @click="searchMore" style="height: 60px; margin: 0 0 0 0.5em;; padding: 0.7em; float: left">
                        <i class="fas fa-plus"></i>
                        <span>{{ $t('more') }}</span>
                    </button>
                </div>
                <span v-show="searchLoading"><i class="fas fa-spinner fa-spin"></i> <span>{{ $t('searching') }}</span></span>
                <span v-show="!searchLoading && searchResults && searchResults.length === 0">
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
    import {openSymbolsService} from "../../js/service/openSymbolsService";

    export default {
        props: ['gridElement', 'gridData', 'imageSearch'],
        data: function () {
            return {
                searchText: null,
                searchResults: null,
                searchLoading: false,
                hasNextChunk: true
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
            setImage(imageElement) {
                let thiz = this;
                thiz.setBase64(imageElement.base64);
                thiz.gridElement.image.author = imageElement.author;
                thiz.gridElement.image.authorURL = imageElement.author_url;
            },
            setBase64(base64) {
                if (!base64) {
                    return;
                }
                let thiz = this;
                if (base64.length > 50 * 1024) {
                    imageUtil.convertBase64(base64, 2 * thiz.elementW).then(newData => {
                        log.info(`converted image from ${Math.round(base64.length / 1024)}kB to ${Math.round(newData.length / 1024)}kB`);
                        thiz.gridElement.image.data = newData;
                    })
                } else {
                    log.debug(`image size is ${Math.round(base64.length / 1024)}kB`);
                    thiz.gridElement.image.data = base64;
                }
            },
            clearImage() {
                this.gridElement.image.data = this.gridElement.image.author = this.gridElement.image.authorURL = null;
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
            searchInput(debounceTime, event) {
                let thiz = this;
                thiz.searchText = event ? event.target.value : thiz.searchText;
                debounceTime = debounceTime === undefined ? 500 : debounceTime;
                thiz.searchResults = [];
                thiz.searchLoading = true;
                util.debounce(function () {
                    openSymbolsService.query(thiz.searchText).then(resultList => {
                        thiz.processSearchResults(resultList);
                    });
                }, debounceTime);
            },
            searchMore() {
                let thiz = this;
                openSymbolsService.nextChunk().then(resultList => {
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
                thiz.hasNextChunk = openSymbolsService.hasNextChunk();
                thiz.searchResults = thiz.searchResults.concat(resultList);
                thiz.searchLoading = false;
                thiz.$forceUpdate();
                resultList.forEach(result => {
                    result.promise.then(() => {
                        thiz.$forceUpdate();
                    });
                });
            }
        },
        mounted() {
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            let maxElementX = Math.max(...this.gridData.gridElements.map(e => e.x + 1));
            this.elementW = Math.round($('#grid-container')[0].getBoundingClientRect().width / maxElementX);
            log.warn(this.imageSearch);
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
    .img-preview > span {
        border: 1px solid lightgray;
        padding: 0.3em;
        width: 150px;
    }

    #imgPreview {
        width: 150px;
    }

    .srow {
        margin-top: 1em;
    }

    @media (max-width: 850px) {
        #inputSearch {
            width: 80%;
        }
    }
</style>