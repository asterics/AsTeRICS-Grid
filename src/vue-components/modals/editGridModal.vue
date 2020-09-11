<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper" @dragenter="preventDefault" @dragover="preventDefault" @drop="imageDropped">
                <div class="modal-container" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()" @keydown.ctrl.right="nextFromKeyboard()" @keydown.ctrl.left="editNext(true)" @keydown.ctrl.y="save(true)">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 v-if="editElementId" name="header" class="inline" data-i18n>
                            Edit grid item // Grid-Element bearbeiten
                        </h1>
                        <h1 v-if="!editElementId" name="header" class="inline" data-i18n>
                            New grid item // Neues Grid-Element
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label class="two columns" for="inputLabel">Label</label>
                            <input type="text" class="five columns" id="inputLabel" v-focus v-if="gridElement" v-model="gridElement.label[currentLang]"/>
                            <button @click="search(gridElement.label[currentLang])" class="two columns" :label="i18nService.translate('Search for images // Suche nach Bildern')"><i class="fas fa-search"/></button>
                            <div class="three columns">
                                <input type="checkbox" id="inputHidden" v-focus v-if="gridElement" v-model="gridElement.hidden"/>
                                <label for="inputHidden" data-i18n="">Hide element // Element ausblenden</label>
                            </div>
                        </div>
                        <div class="row">
                            <label for="inputImg" class="two columns" data-i18n>Image // Bild</label>
                            <button onclick="document.getElementById('inputImg').click();" class="five columns file-input">
                                <input type="file" class="five columns" id="inputImg" @change="changedImg" accept="image/*"/>
                                <span><i class="fas fa-file-upload"/> <span data-i18n>Choose file // Datei auswählen</span></span>
                            </button>
                            <button class="five columns" v-show="tempImage.data" @click="clearImage"><i class="fas fa-times"/> <span data-i18n>Clear image // Bild löschen</span></button>
                        </div>
                        <div class="row">
                            <div class="img-preview offset-by-two four columns">
                                <span class="show-mobile" v-show="!tempImage.data"><i class="fas fa-image"/> <span data-i18n>no image chosen // kein Bild ausgewählt</span></span>
                                <span class="hide-mobile" v-show="!tempImage.data"><i class="fas fa-arrow-down"/> <span data-i18n>drop image here // Bild hierher ziehen</span></span>
                                <img v-if="tempImage.data" id="imgPreview" :src="tempImage.data"/>
                                <div v-if="tempImage.data && tempImage.author">
                                    by <a :href="tempImage.authorURL" target="_blank">{{tempImage.author}}</a>
                                </div>
                            </div>
                            <div class="img-preview five columns hide-mobile" v-show="tempImage.data" style="margin-top: 50px;">
                                <span><i class="fas fa-arrow-down"/> <span data-i18n>drop new image here // neues Bild hierher ziehen</span></span>
                            </div>
                        </div>
                        <div class="row">
                            <label for="inputSearch" class="two columns" data-i18n>Image search // Bildsuche</label>
                            <div class="five columns">
                                <input id="inputSearch" type="text" v-model="searchText" @input="searchInput(500, $event)" :placeholder="'SEARCH_IMAGE_PLACEHOLDER' | translate"/>
                                <button @click="clearSearch" aria-label="Clear"><i class="fas fa-times"></i></button>
                            </div>
                            <span class="four columns" data-i18n="">
                                <span>powered by <a href="https://www.opensymbols.org/" target="_blank">opensymbols.org</a></span>
                                <span>Suche durch <a href="https://www.opensymbols.org/" target="_blank">opensymbols.org</a></span>
                            </span>
                        </div>
                        <div class="row">
                            <div class="offset-by-two ten columns">
                                <div v-for="imgElement in searchResults" class="inline">
                                    <img v-if="imgElement.base64" :src="imgElement.base64" @click="setImage(imgElement)" :title="'by ' + imgElement.author" width="60" height="60" class="inline" role="button"/>
                                    <span v-if="!imgElement.base64 && !imgElement.failed" style="position: relative">
                                        <img src="data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" :title="imgElement.image_url" width="60" height="60" class="inline"/>
                                        <i class="fas fa-spinner fa-spin" style="position: absolute; top: -25px; left: 25px;"></i>
                                    </span>
                                </div>
                                <div class="inline" v-show="searchResults && searchResults.length > 0 && hasNextChunk">
                                    <button @click="searchMore" style="height: 60px; margin: 0 0 0 0.5em;; padding: 0.7em; float: left">
                                        <i class="fas fa-plus"></i>
                                        <span data-i18n="">more // mehr</span>
                                    </button>
                                </div>
                                <span v-show="searchLoading"><i class="fas fa-spinner fa-spin"></i> <span data-i18n="">searching... // suche...</span></span>
                                <span v-show="!searchLoading && searchResults && searchResults.length === 0" data-i18n="">
                                    <span><b>No search results.</b></span>
                                    <span><b>Keine Resultate.</b> Versuchen Sie es ev. nochmal mit einem <b>englischen Suchbegriff</b>.</span>
                                </span><br/>
                                <span v-show="!searchLoading && searchResults && searchResults.length === 0" data-i18n="">
                                    <span></span>
                                    <span>Für eine Symbolsuche auf Deutsch können Sie <a target="_blank" href="https://www.pictoselector.eu/de/home/download/">Picto-Selector</a> verwenden. Symbole aus diesem Programm können mit Drag & Drop direkt in AsTeRICS Grid eingefügt werden.</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container" v-if="gridElement">
                            <div class="row">
                                <button @click="$emit('close')" title="Keyboard: [Esc]" class="four columns offset-by-four">
                                    <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                                </button>
                                <button @click="save()" title="Keyboard: [Ctrl + Enter]" class="four columns">
                                    <i class="fas fa-check"/> <span>OK</span>
                                </button>
                            </div>
                            <div class="hide-mobile row">
                                <div v-if="editElementId">
                                    <button @click="editNext(true)" title="Keyboard: [Ctrl + Left]" class="four columns offset-by-four"><i class="fas fa-angle-double-left"/> <span data-i18n>OK, edit previous // OK, voriges bearbeiten</span></button>
                                    <button @click="editNext()" title="Keyboard: [Ctrl + Right]" class="four columns"><span data-i18n>OK, edit next // OK, nächstes bearbeiten</span> <i class="fas fa-angle-double-right"/></button>
                                </div>
                                <div v-if="!editElementId">
                                    <button @click="addNext()" title="Keyboard: [Ctrl + Right]" class="four columns offset-by-eight"><i class="fas fa-plus"/> <span data-i18n>OK, add another // OK, weiteres Element</span></button>
                                </div>
                            </div>
                            <div class="hide-mobile row">
                                <button @click="save(true)" title="Keyboard: [Ctrl + Y]" class="four columns offset-by-eight"><span data-i18n>OK, edit actions // OK, Aktionen bearbeiten</span> <i class="fas fa-bolt"/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {i18nService} from "../../js/service/i18nService";
    import {imageUtil} from './../../js/util/imageUtil';
    import {GridImage} from "../../js/model/GridImage";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import {util} from "../../js/util/util";
    import {openSymbolsService} from "../../js/service/openSymbolsService";
    import {gridUtil} from "../../js/util/gridUtil";

    export default {
        props: ['editElementIdParam', 'gridDataId', 'gridInstance'],
        data: function () {
            return {
                gridData: null,
                gridElement: null,
                metadata: null,
                originalGridElementJSON: null,
                elementW: null,
                editElementId: null,
                searchText: null,
                searchResults: null,
                searchLoading: false,
                hasNextChunk: true,
                tempImage: {},
                i18nService: i18nService,
                currentLang: i18nService.getBrowserLang()
            }
        },
        methods: {
            changedImg() {
                let thiz = this;
                thiz.clearImage();
                imageUtil.getBase64FromInput($('#inputImg')[0]).then(base64 => {
                    thiz.tempImage.data = base64;
                });
            },
            imageDropped(event) {
                event.preventDefault();
                this.clearImage();
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    $('#inputImg')[0].files = event.dataTransfer.files;
                    this.changedImg();
                } else {
                    let url = event.dataTransfer.getData('URL');
                    imageUtil.urlToBase64(url).then(resultBase64 => {
                        this.tempImage.data = resultBase64;
                    });
                }
            },
            setImage(imageElement) {
                let thiz = this;
                thiz.tempImage.data = imageElement.base64;
                thiz.tempImage.author = imageElement.author;
                thiz.tempImage.authorURL = imageElement.author_url;
            },
            clearImage() {
                this.tempImage.data = this.tempImage.author = this.tempImage.authorURL = null;
            },
            save(toActions) {
                this.saveInternal().then((savedSomething) => {
                    this.$emit('close');
                    if (savedSomething && !this.editElementId) {
                        this.$emit('mark', this.gridElement.id);
                    }
                    if (toActions) {
                        this.$emit('actions', this.gridElement.id);
                    }
                });
            },
            addNext() {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                if (!thiz.editElementId) return;

                thiz.saveInternal().then(() => {
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection);
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            nextFromKeyboard() {
                if (this.editElementId) {
                    this.editNext();
                } else {
                    this.addNext();
                }
            },
            saveInternal() {
                var thiz = this;
                return new Promise(resolve => {
                    if (!thiz.gridElement.image) {
                        thiz.gridElement.image = new GridImage();
                    }
                    if (thiz.tempImage.data && thiz.tempImage.data !== thiz.gridElement.image.data) {
                        thiz.gridElement.image = thiz.tempImage;
                        imageUtil.convertBase64(thiz.tempImage.data, Math.max(thiz.elementW, 500)).then(bigImageData => {
                            let imgToSave = new GridImage({data: bigImageData});
                            return dataService.saveImage(imgToSave);
                        }).then(savedId => {
                            thiz.gridElement.image.id = savedId;
                            return imageUtil.convertBase64(thiz.tempImage.data, thiz.elementW)
                        }).then(reducedData => {
                            thiz.gridElement.image.data = reducedData;
                            saveInternalInternal();
                        });
                    } else {
                        if (!thiz.tempImage.data) thiz.gridElement.image = null;
                        saveInternalInternal();
                    }

                    function saveInternalInternal() {
                        if (thiz.gridElement && thiz.originalGridElementJSON !== JSON.stringify(thiz.gridElement)) {
                            let grid = gridUtil.updateOrAddGridElement(thiz.gridData, thiz.gridElement);
                            thiz.gridInstance.updateGridWithUndo(grid).then(updated => {
                                resolve(updated);
                            });
                        } else {
                            resolve(false);
                        }
                    }
                });
            },
            initInternal() {
                var thiz = this;
                thiz.resetInternal();
                thiz.tempImage = JSON.parse(JSON.stringify(new GridImage()));
                dataService.getGrid(thiz.gridDataId).then(gridData => {
                    thiz.gridData = JSON.parse(JSON.stringify(gridData));
                    if (thiz.editElementId) {
                        let gridElem = thiz.gridData.gridElements.filter(e => e.id === thiz.editElementId)[0];
                        thiz.gridElement = JSON.parse(JSON.stringify(gridElem));
                        if (gridElem.image && gridElem.image.data) {
                            thiz.tempImage = JSON.parse(JSON.stringify(new GridImage(gridElem.image)));
                        }
                        thiz.elementW = $('#' + this.gridElement.id)[0].getBoundingClientRect().width;
                        thiz.originalGridElementJSON = JSON.stringify(gridElem);
                    } else {
                        var newXYPos = gridData.getNewXYPos();
                        log.debug('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                        thiz.gridElement = JSON.parse(JSON.stringify(new GridElement({
                            x: newXYPos.x,
                            y: newXYPos.y
                        })));
                        var oneElemHeight = Math.round($('#grid-container')[0].getBoundingClientRect().height / gridData.rowCount);
                        thiz.elementW = 2 * oneElemHeight;
                        thiz.originalGridElementJSON = JSON.stringify(thiz.gridElement);
                    }
                });

                dataService.getMetadata().then(metadata => {
                    thiz.metadata = metadata;
                });
            },
            resetInternal() {
                this.gridElement = this.metadata = this.originalGridElementJSON = this.elementW = null;
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
            this.editElementId = this.editElementIdParam;
            this.initInternal();
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
        },
        updated() {
            i18nService.initDomI18n();
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

    .row {
        margin-top: 1em;
    }

    @media (max-width: 850px) {
        #inputSearch {
            width: 80%;
        }
    }
</style>