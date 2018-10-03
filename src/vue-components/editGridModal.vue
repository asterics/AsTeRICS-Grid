<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">

                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Edit grid item // Grid-Element bearbeiten
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label class="two columns" for="inputLabel">Label</label>
                            <input type="text" class="ten columns" id="inputLabel" v-if="gridElement" v-model="gridElement.label"/>
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
                        <button class="u-pull-right" @click="save()">
                            OK
                        </button>
                        <button class="u-pull-right spaced" @click="$emit('close')" data-i18n>
                            Cancel // Abbrechen
                        </button>
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
        props: ['editElementId', 'gridData'],
        data: function () {
            return {
                gridElement: null,
                metadata: null,
                originalGridElementJSON: null,
                imgDataFull: null,
                imgDataSmall: null,
                imgDataBig: null,
                imgDataPreview: null,
                elementW: null
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
                var thiz = this;
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
                        this.$emit('reload', thiz.gridElement);
                        this.$emit('close');
                    });
                } else {
                    this.$emit('close');
                }
            }
        },
        mounted () {
            var thiz = this;
            I18nModule.init();
            if(thiz.editElementId) {
                dataService.getGridElement(thiz.gridData.id, this.editElementId).then(gridElem => {
                    console.log('editing element: ' + gridElem.label);
                    thiz.gridElement = gridElem;
                    if(gridElem.image) {
                        imageUtil.convertBase64(gridElem.image.data).then(response => {
                            thiz.imgDataPreview = response;
                        });
                    }
                    thiz.elementW = $('#' + this.gridElement.id)[0].getBoundingClientRect().width;
                    thiz.originalGridElementJSON = JSON.stringify(gridElem);
                });
            } else {
                var newXYPos = new GridData(thiz.gridData).getNewXYPos();
                console.log('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                thiz.gridElement = new GridElement({
                    x: newXYPos.x,
                    y: newXYPos.y
                });
                var oneElemHeight = Math.round($('#grid-container')[0].getBoundingClientRect().height / thiz.gridData.rowCount);
                thiz.elementW = 2 * oneElemHeight;
                thiz.originalGridElementJSON = JSON.stringify(thiz.gridElement);
            }

            dataService.getMetadata().then(metadata => {
                thiz.metadata = metadata;
            });
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