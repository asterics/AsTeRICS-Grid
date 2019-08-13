<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper" @dragenter="preventDefault" @dragover="preventDefault" @drop="imageDropped">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()" @keyup.ctrl.right="nextFromKeyboard()" @keyup.ctrl.left="editNext(true)">
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

                    <div class="modal-body container">
                        <div class="row">
                            <label class="two columns" for="inputLabel">Label</label>
                            <input type="text" class="five columns" id="inputLabel" v-focus v-if="gridElement" v-model="gridElement.label"/>
                            <button @click="search(gridElement.label)" class="five columns"><i class="fas fa-search"/> <span data-i18n="">Search for images // Suche nach Bildern</span></button>
                        </div>
                        <div class="row">
                            <label for="inputImg" class="two columns" data-i18n>Image // Bild</label>
                            <button onclick="document.getElementById('inputImg').click();" class="five columns file-input">
                                <input type="file" class="five columns" id="inputImg" size="200"  @change="changedImg" accept="image/*"/>
                                <span><i class="fas fa-file-upload"/> <span data-i18n>Choose file // Datei auswählen</span></span>
                            </button>
                            <button class="five columns" v-show="imgDataPreview" @click="clearImage"><i class="fas fa-times"/> <span data-i18n>Clear image // Bild löschen</span></button>
                        </div>
                        <div class="row">
                            <div class="img-preview offset-by-two four columns">
                                <span class="show-mobile" v-show="!imgDataPreview"><i class="fas fa-image"/> <span data-i18n>no image chosen // kein Bild ausgewählt</span></span>
                                <span class="hide-mobile" v-show="!imgDataPreview"><i class="fas fa-arrow-down"/> <span data-i18n>drop image here // Bild hierher ziehen</span></span>
                                <img v-if="imgDataPreview" id="imgPreview" :src="imgDataPreview"/>
                                <img v-show="false" id="fullImg" :src="imgDataFull" @load="imgLoaded"/>
                            </div>
                            <div class="img-preview five columns hide-mobile" v-show="imgDataPreview" style="margin-top: 50px;">
                                <span><i class="fas fa-arrow-down"/> <span data-i18n>drop new image here // neues Bild hierher ziehen</span></span>
                            </div>
                        </div>
                        <div class="row">
                            <label for="inputSearch" class="two columns" data-i18n>Image search // Bildsuche</label>
                            <div class="five columns">
                                <input id="inputSearch" type="text" v-model="searchText" @input="searchInput()" :placeholder="'SEARCH_IMAGE_PLACEHOLDER' | translate"/>
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
                                    <img v-if="imgElement.base64" :src="imgElement.base64" @click="setBase64(imgElement.base64)" :title="'by ' + imgElement.author" width="60" height="60" class="inline" role="button"/>
                                    <span v-if="!imgElement.base64 && !imgElement.failed" style="position: relative">
                                        <img src="data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" :title="imgElement.image_url" width="60" height="60" class="inline"/>
                                        <i class="fas fa-spinner fa-spin" style="position: absolute; top: -25px; left: 25px;"></i>
                                    </span>
                                </div>
                                <div class="inline">
                                    <button v-show="searchResults && searchResults.length > 0 && hasNextChunk" @click="searchMore" style="height: 60px; margin: 0 0 0 0.5em;; padding: 0.7em; float: left">
                                        <i class="fas fa-plus"></i>
                                        <span data-i18n="">more // mehr</span>
                                    </button>
                                </div>
                                <span v-show="searchLoading"><i class="fas fa-spinner fa-spin"></i> <span data-i18n="">searching... // suche...</span></span>
                                <span v-show="!searchLoading && searchResults && searchResults.length === 0" data-i18n="">No search results. // Keine Resultate. Versuchen Sie es ev. nochmal mit einem englischen Suchbegriff.</span>

                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container" v-if="gridElement">
                            <button @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" :disabled="!gridElement.label && !imgDataPreview" title="Keyboard: [Ctrl + Enter]">
                                <i class="fas fa-check"/> <span>OK</span>
                            </button>
                            <div class="hide-mobile" v-if="editElementId">
                                <button @click="editNext(true)" :disabled="!gridElement.label && !imgDataPreview" title="Keyboard: [Ctrl + Left]"><i class="fas fa-angle-double-left"/> <span data-i18n>OK, edit previous // OK, voriges bearbeiten</span></button>
                                <button @click="editNext()" :disabled="!gridElement.label && !imgDataPreview" title="Keyboard: [Ctrl + Right]"><span data-i18n>OK, edit next // OK, nächstes bearbeiten</span> <i class="fas fa-angle-double-right"/></button>
                            </div>
                            <div class="hide-mobile" v-if="!editElementId">
                                <button @click="addNext()" :disabled="!gridElement.label && !imgDataPreview" title="Keyboard: [Ctrl + Right]" style="float: right;"><i class="fas fa-plus"/> <span data-i18n>OK, add another // OK, weiteres Element</span></button>
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

    export default {
        props: ['editElementIdParam', 'gridData'],
        data: function () {
            return {
                gridElement: null,
                metadata: null,
                originalGridElementJSON: null,
                imgDataFull: null,
                imgDataSmall: null,
                imgDataBig: null,
                imgDataPreview: null,
                elementW: null,
                editElementId: null,
                searchText: null,
                searchResults: null,
                searchLoading: false,
                hasNextChunk: true
            }
        },
        methods: {
            changedImg () {
                imageUtil.getBase64FromInput($('#inputImg')[0]).then(base64 => {
                    this.imgDataFull = base64;
                });
            },
            imageDropped(event) {
                event.preventDefault();
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    $('#inputImg')[0].files = event.dataTransfer.files;
                    this.changedImg();
                } else {
                    let url = event.dataTransfer.getData('URL');
                    imageUtil.urlToBase64(url).then(resultBase64 => {
                        this.imgDataFull = resultBase64;
                    });
                }
            },
            imgLoaded (event) {
                this.imgDataPreview = imageUtil.getBase64FromImg(event.target);
                this.imgDataSmall = imageUtil.getBase64FromImg(event.target, this.elementW);
                this.imgDataBig = imageUtil.getBase64FromImg(event.target, Math.max(this.elementW, 500));
            },
            setBase64(base64String) {
                let thiz = this;
                imageUtil.convertBase64(base64String).then(data => {
                    thiz.imgDataPreview = data;
                });
                this.imgDataSmall = imageUtil.convertBase64(base64String, this.elementW).then(data => {
                    thiz.imgDataSmall = data;
                });
                this.imgDataBig = imageUtil.convertBase64(base64String, Math.max(this.elementW, 500)).then(data => {
                    thiz.imgDataBig = data;
                });
            },
            clearImage() {
                this.imgDataPreview = this.imgDataSmall = this.imgDataBig = null;
            },
            save () {
                if(!this.gridElement.label && !this.imgDataPreview) return;
                this.saveInternal().then(savedSomething => {
                    if(savedSomething) {
                        this.$emit('reload');
                        this.$emit('close');
                    } else {
                        this.$emit('close');
                    }
                });
            },
            addNext() {
                var thiz = this;
                if(!thiz.gridElement.label && !thiz.imgDataPreview) return;

                thiz.saveInternal().then(() => {
                    thiz.$emit('reload');
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                if(!thiz.editElementId || (!thiz.gridElement.label && !thiz.imgDataPreview)) return;

                thiz.saveInternal().then(savedSomething => {
                    if(savedSomething) {
                        thiz.$emit('reload');
                    }
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection);
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            nextFromKeyboard() {
                if(this.editElementId) {
                    this.editNext();
                } else {
                    this.addNext();
                }
            },
            saveInternal() {
                var thiz = this;
                return new Promise(resolve => {
                    if(thiz.imgDataBig) {
                        var imgToSave = new GridImage({data: thiz.imgDataBig});
                        dataService.saveImage(imgToSave).then(savedId => {
                            thiz.gridElement.image = new GridImage({id: savedId, data: thiz.imgDataSmall});
                            saveInternalInternal();
                        });
                    } else {
                        if(!thiz.imgDataPreview) thiz.gridElement.image = null;
                        saveInternalInternal();
                    }

                    function saveInternalInternal() {
                        if(thiz.gridElement && thiz.originalGridElementJSON != JSON.stringify(thiz.gridElement)) {
                            dataService.updateOrAddGridElement(thiz.gridData.id, thiz.gridElement).then(() => {
                                resolve(true);
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
                if(thiz.editElementId) {
                    dataService.getGridElement(thiz.gridData.id, this.editElementId).then(gridElem => {
                        log.debug('editing element: ' + gridElem.label);
                        thiz.gridElement = JSON.parse(JSON.stringify(gridElem));
                        if(gridElem.image) {
                            imageUtil.convertBase64(gridElem.image.data).then(response => {
                                thiz.imgDataPreview = response;
                            });
                        }
                        thiz.elementW = $('#' + this.gridElement.id)[0].getBoundingClientRect().width;
                        thiz.originalGridElementJSON = JSON.stringify(gridElem);
                    });
                } else {
                    dataService.getGrid(thiz.gridData.id).then(gridDataCurrent => {
                        var newXYPos = gridDataCurrent.getNewXYPos();
                        log.debug('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                        thiz.gridElement = JSON.parse(JSON.stringify(new GridElement({
                            x: newXYPos.x,
                            y: newXYPos.y
                        })));
                        var oneElemHeight = Math.round($('#grid-container')[0].getBoundingClientRect().height /gridDataCurrent.rowCount);
                        thiz.elementW = 2 * oneElemHeight;
                        thiz.originalGridElementJSON = JSON.stringify(thiz.gridElement);
                    });
                }

                dataService.getMetadata().then(metadata => {
                    thiz.metadata = metadata;
                });
            },
            resetInternal() {
                this.gridElement = this.metadata = this.originalGridElementJSON = this.imgDataFull = this.imgDataSmall = this.imgDataBig = this.imgDataPreview = this.elementW = null;
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
            searchInput(debounceTime) {
                let thiz = this;
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
        mounted () {
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
</style>