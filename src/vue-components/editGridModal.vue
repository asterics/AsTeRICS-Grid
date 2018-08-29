<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">

                    <div class="modal-header">
                        <div name="header" data-i18n>
                            Edit grid item // Grid-Element bearbeiten
                        </div>
                    </div>

                    <div class="modal-body">
                        <div>
                            <label for="inputLabel">Label</label>
                            <input id="inputLabel" v-if="gridElement" type="text" v-model="gridElement.label"/>
                        </div>
                        <div>
                            <label for="inputImg" data-i18n>Image // Bild</label>
                            <input id="inputImg" type="file" @change="changedImg" accept="image/*"/>
                            <img id="imgPreview" :src="imgDataPreview"/>
                            <img id="fullImg" :src="imgDataFull" @load="imgLoaded" style="display: none"/>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="modal-default-button" @click="save()">
                            OK
                        </button>
                        <button class="modal-default-button" @click="$emit('close')">
                            Cancel
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

    export default {
        props: ['gridId', 'editElementId'],
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
                }

                if(thiz.gridElement && thiz.originalGridElementJSON != JSON.stringify(thiz.gridElement)) {
                    dataService.updateGridElement(thiz.gridId, thiz.gridElement).then(() => {
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
            console.log('opened modal: ' + thiz.editElementId);
            I18nModule.init();
            dataService.getGridElement(thiz.gridId, this.editElementId).then(gridElem => {
                thiz.gridElement = gridElem;
                thiz.elementW = $('#' + this.gridElement.id)[0].getBoundingClientRect().width;
                thiz.originalGridElementJSON = JSON.stringify(gridElem);
            });
            dataService.getMetadata().then(metadata => {
                thiz.metadata = metadata;
            });
        }
    }
</script>

<style scoped>
    .modal-mask {
        position: fixed;
        z-index: 9998;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, .5);
        display: table;
        transition: opacity .3s ease;
    }

    .modal-wrapper {
        display: table-cell;
        vertical-align: middle;
    }

    .modal-container {
        width: 300px;
        margin: 0px auto;
        padding: 2em;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
        transition: all .3s ease;
        font-family: Helvetica, Arial, sans-serif;
    }

    .modal-header h3 {
        margin-top: 0;
        color: #42b983;
    }

    .modal-body {
        margin: 20px 0;
    }

    .modal-default-button {
        float: right;
    }

    /*
     * The following styles are auto-applied to elements with
     * transition="modal" when their visibility is toggled
     * by Vue.js.
     *
     * You can easily play with the modal transition by editing
     * these styles.
     */

    .modal-enter {
        opacity: 0;
    }

    .modal-leave-active {
        opacity: 0;
    }

    .modal-enter .modal-container,
    .modal-leave-active .modal-container {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
    }
</style>