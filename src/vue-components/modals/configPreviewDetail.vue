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
                        <div v-if="preview.images.length > 1" aria-hidden="true" class="mb-5" style="overflow-x: auto">
                            <ul class="d-flex mb-0">
                                <li v-for="url of preview.images" class="me-3 mb-0">
                                    <img :src="url" @click="selectedImage = url" width="200" style="cursor: pointer"/>
                                </li>
                            </ul>
                        </div>
                        <div class="container-fluid p-0">
                            <div class="row" aria-hidden="true">
                                <div class="col-12 col-md-7" v-if="selectedImage">
                                    <img :src="selectedImage" class="col-12"/>
                                </div>
                                <div class="col-12 col-md-5">
                                    <div class="mb-3" v-if="preview.author">
                                        <strong>{{ $t('author') }}</strong>:
                                        <span v-if="!preview.website">{{preview.author}}</span>
                                        <a v-if="preview.website" :href="preview.website" target="_blank">{{preview.author}}</a>
                                    </div>
                                    <div class="mb-3" v-if="preview.description"><strong>{{ $t('description') }}</strong>: <span v-html="i18nService.getTranslation(preview.description)"></span></div>
                                    <div v-if="preview.languages.length === 1"><strong>{{ $t('language') }}</strong>: {{ $t('lang.' + preview.languages[0]) }}</div>
                                    <div v-if="preview.languages.length > 1"><strong>{{ $t('languages') }}</strong>: {{ preview.languages.reduce((total, current, index, array) => {
                                        let separator = index < array.length - 1 ? ', ' : '';
                                        return total + $t('lang.' + current) + separator;
                                    }, '') }}
                                    </div>
                                    <div class="mt-3" v-if="preview.tags.length > 0">
                                        <strong>{{ $t('tags') }}</strong>:
                                        <span class="tag" style="background-color: lightgray" v-for="tag in preview.tags">{{ tag }}</span>
                                    </div>
                                    <div class="mt-5" v-if="preview.githubUrl">
                                        <a :href="preview.githubUrl" target="_blank"><i class="fab fa-github"/> {{ $t('editOnGithub') }}</a>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <a href="javascript:;" class="me-2" @click="copyLink">{{ $t('copyDirectLinkToConfigToClipboard') }}</a>
                                <span v-if="linkCopied" class="fas fa-check"/>
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
    import { i18nService } from '../../js/service/i18nService';
    import { urlParamService } from '../../js/service/urlParamService';
    import { util } from '../../js/util/util';

    export default {
        props: ['preview'],
        data: function () {
            return {
                selectedImage: this.preview.images[0],
                i18nService: i18nService,
                linkCopied: false
            }
        },
        methods: {
            save() {
                this.$emit('import');
                this.$emit('close');
            },
            copyLink() {
                let link = location.origin + location.pathname + `?${urlParamService.params.PARAM_USE_GRIDSET_FILENAME}=${this.preview.filename}`;
                util.copyToClipboard(link);
                this.linkCopied = true;
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

.tag {
    flex-shrink: 1;
    margin: 0.3em 0.3em 0.3em 0;
    border-radius: 5px;
    padding: 0px 3px 0px 3px;
}
</style>