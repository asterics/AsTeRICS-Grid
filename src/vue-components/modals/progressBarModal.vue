<template>
    <base-modal icon="fas fa-spinner fa-spin" :title="options.header" :footer="options.closable" :help="false" :esc="options.closable" v-on="$listeners">
                    <template #default>
                        <div class="biggerFont">{{options.text}} ...</div>
                        <div id="progressWrapper" style="border: 1px solid; border-radius: 3px; width: 100%; height: 50px; margin: 0.5em 0">
                            <div id="progressBar" :style="`width: ${progressPercentage}%; height: 100%; background-color: green`"></div>
                        </div>
                        <div class="biggerFont" style="text-align: right; width: 100%; margin-bottom: 2rem;">{{Math.round(progressPercentage)}}%</div>
                    </template>
                    <template #footer>
                        <div v-if="options.closable">
                            <button @click="close" :title="$t('keyboardEsc')" :aria-label="$t('cancel')">
                                <i class="fas fa-times" aria-hidden="true"></i><span>{{ $t('cancel') }}</span>
                            </button>
                        </div>
                    </template>
    </base-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {modalMixin} from "../mixins/modalMixin";

    let defaultOptions = {
        header: '',
        closable: false,
        cancelFn: null,
        text: ''
    }

    export default {
        mixins: [modalMixin],
        data: function () {
            return {
                progressPercentage: 0,
                options: JSON.parse(JSON.stringify(defaultOptions))
            }
        },
        methods: {
            setProgress(percentage, options) {
                this.progressPercentage = Math.min(percentage, 100);
                Object.keys(this.options).forEach(key => {
                    if (options && options[key] !== undefined) {
                        this.options[key] = options[key];
                    }
                });
                if (Math.abs(this.progressPercentage - 100) < 0.001) {
                    setTimeout(() => {
                        this.options = JSON.parse(JSON.stringify(defaultOptions));
                        this.$emit('close');
                        this.closeModal();
                    }, 200)
                }
            },
            close() {
                // FIXME: close() can only be called if the modal is closable
                if (this.options.closable) {
                    this.$emit('close');
                    this.closeModal();
                    if (this.options.cancelFn) {
                        this.options.cancelFn();
                    }
                    this.options = JSON.parse(JSON.stringify(defaultOptions));
                }
            }
        }
    }
</script>

<style scoped>
    .biggerFont {
        font-size: 1.3em;
    }
</style>