<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1>{{ preview.name | extractTranslation }}</h1>
                    </div>

                    <div class="modal-body">
                        <div class="mb-5" style="overflow-x: auto">
                            <ul v-if="preview.images.length > 1" class="d-flex mb-0">
                                <li v-for="url of preview.images" class="me-3 mb-0">
                                    <img aria-hidden="true" :src="url" @click="selectedImage = url" width="200"/>
                                </li>
                            </ul>
                        </div>
                        <div class="container-fluid p-0">
                            <div class="row">
                                <div class="col-12 col-md-4">Info</div>
                                <div class="col-12 col-md-8" v-if="selectedImage">
                                    <img aria-hidden="true" :src="selectedImage" class="col-12"/>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="modal-footer container-fluid p-0">
                        <div class="row">
                            <div class="col-12 col-md-6">
                                <button id="cancelButton" v-focus class="col-12" @click="$emit('close')" :title="$t('keyboardEsc')">
                                    <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                                </button>
                            </div>
                            <div class="col-12 col-md-6">
                                <button class="col-12 btn-primary" @click="save()" :title="$t('keyboardCtrlEnter')">
                                    <i class="fas fa-check"/> <span>{{ $t('useIt') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';

    export default {
        props: ['preview'],
        data: function () {
            return {
                selectedImage: this.preview.images[0]
            }
        },
        methods: {
            save() {
                thiz.$emit('reload');
                thiz.$emit('close');
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
ul {
    list-style-type: none;
}
</style>