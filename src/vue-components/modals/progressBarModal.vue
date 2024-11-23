<template>
    <modal :title="options.header">
        <template>
            <div class="biggerFont">{{options.text}} ...</div>
            <div id="progressWrapper" style="border: 1px solid; border-radius: 3px; width: 100%; height: 50px; margin: 0.5em 0">
                <div id="progressBar" :style="`width: ${progressPercentage}%; height: 100%; background-color: green`"></div>
            </div>
            <div class="biggerFont" style="text-align: right; width: 100%">{{Math.round(progressPercentage)}}%</div>
        </template>
        <template #footer>
            <div v-if="options.closable" class="button-container srow">
                <button
                    class="four columns offset-by-eight"
                    @click="close"
                    @keydown.esc="close"
                    :aria-label="$t('cancel')"
                    :title="$t('keyboardEsc')"
                    >
                        <i class="fas fa-times" aria-hidden="true"></i>
                        {{ $t('cancel') }}
                </button>
            </div>
        </template>
    </modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import { modalMixin } from '../mixins/modalMixin.js';

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
                    }, 200)
                }
            },
            close() {
                if (this.options.closable) {
                    this.$emit('close');
                    if (this.options.cancelFn) {
                        this.options.cancelFn();
                    }
                    this.options = JSON.parse(JSON.stringify(defaultOptions));
                }
            }
        },
    }
</script>

<style scoped>
    .biggerFont {
        font-size: 1.3em;
    }
    .modal-mask {
        z-index: 9999;
    }

</style>