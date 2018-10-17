<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.enter="save()" @keyup.ctrl.right="nextFromKeyboard()" @keyup.ctrl.left="editNext(true)">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
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
                            <input type="text" class="ten columns" id="inputLabel" v-focus v-if="gridElement" v-model="gridElement.label"/>
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
                            <div class="img-preview offset-by-two ten columns">
                                <span v-show="!imgDataPreview"><i class="fas fa-image"/> <span data-i18n>no image chosen // kein Bild ausgewählt</span></span>
                                <img v-if="imgDataPreview" id="imgPreview" :src="imgDataPreview"/>
                                <img v-show="false" id="fullImg" :src="imgDataFull" @load="imgLoaded"/>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container" v-if="gridElement">
                            <button @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" :disabled="!gridElement.label && !imgDataPreview" title="Keyboard: [Enter]">
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
    import {dataService} from './../js/service/dataService'
    import {I18nModule} from './../js/i18nModule.js';
    import {imageUtil} from './../js/util/imageUtil';
    import {GridImage} from "../js/model/GridImage";
    import './../css/modal.css';
    import {GridElement} from "../js/model/GridElement";
    import {GridData} from "../js/model/GridData";

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
                editElementId: null
            }
        },
        methods: {
            changedImg (event) {
                imageUtil.getBase64FromInput(event.target).then(base64 => {
                    this.imgDataFull = base64;
                });
            },
            imgLoaded (event) {
                this.imgDataPreview = imageUtil.getBase64FromImg(event.target);
                this.imgDataSmall = imageUtil.getBase64FromImg(event.target, this.elementW);
                this.imgDataBig = imageUtil.getBase64FromImg(event.target, Math.max(this.elementW, 500));
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
                    var ids = thiz.gridData.gridElements.map(el => el.id);
                    var index = ids.indexOf(thiz.editElementId);
                    if(index !== -1) {
                        var increment = invertDirection ? -1 : 1;
                        var newIndex = index + increment;
                        newIndex = (newIndex > ids.length - 1) ? 0 : newIndex;
                        newIndex = (newIndex < 0) ? ids.length - 1 : newIndex;
                        thiz.editElementId = ids[newIndex]
                    } else {
                        thiz.editElementId = ids[0];
                    }
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
                        var imgHash = imageUtil.hashCode(thiz.imgDataBig);
                        if(thiz.metadata && thiz.metadata.imageHashCodes && thiz.metadata.imageHashCodes[imgHash]) {
                            imgToSave.id = thiz.metadata.imageHashCodes[imgHash];
                        } else {
                            dataService.saveImage(imgToSave);
                            thiz.metadata.imageHashCodes[imgHash] = imgToSave.id;
                            dataService.saveMetadata(thiz.metadata);
                        }
                        thiz.gridElement.image = new GridImage({id: imgToSave.id, data: thiz.imgDataSmall});
                    } else if(!thiz.imgDataPreview) {
                        thiz.gridElement.image = null;
                    }

                    if(thiz.gridElement && thiz.originalGridElementJSON != JSON.stringify(thiz.gridElement)) {
                        dataService.updateOrAddGridElement(thiz.gridData.id, thiz.gridElement).then(() => {
                            resolve(true);
                        });
                    } else {
                        resolve(false);
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
            }
        },
        mounted () {
            this.editElementId = this.editElementIdParam;
            this.initInternal();
        },
        updated() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .img-preview > span {
        border: 1px solid lightgray;
        padding: 0.3em;
        width: 150px;
    }

    .row {
        margin-top: 1em;
    }
</style>