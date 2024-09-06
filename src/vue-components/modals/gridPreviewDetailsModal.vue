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
                        <grid-preview-details :preview="preview"/>
                        <div class="mt-5">
                            <a href="javascript:;" class="me-2" @click="copyLink"><i class="far fa-copy"/> {{ $t('copyDirectLinkToConfigToClipboard') }}</a>
                            <span v-if="linkCopied" class="fas fa-check"/>
                        </div>
                        <div class="mt-2" v-if="preview.githubUrl">
                            <a :href="preview.githubUrl" target="_blank"><i class="fab fa-github"/> {{ $t('editOnGithub') }}</a>
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
    import { util } from '../../js/util/util';
    import { externalBoardsService } from '../../js/service/boards/externalBoardsService';
    import GridPreviewDetails from './gridPreviewDetails.vue';

    export default {
        components: { GridPreviewDetails },
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
                let link = externalBoardsService.getDirectLink(this.preview.providerName, this.preview.id);
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