<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="close()">
                    <a v-if="options.closable" class="inline close-button" href="javascript:void(0);" @click="close()"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">{{options.header}}</h1>
                    </div>

                    <div class="modal-body">
                        <div class="biggerFont" v-if="options.text">{{options.text}} ...</div>
                        <div id="progressWrapper" style="border: 1px solid; border-radius: 3px; width: 100%; height: 50px; margin: 0.5em 0">
                            <div id="progressBar" :style="`width: ${progressPercentage}%; height: 100%; background-color: green`"></div>
                        </div>
                        <div class="biggerFont" style="text-align: right; width: 100%">{{Math.round(progressPercentage)}}%</div>
                    </div>

                    <div class="modal-footer">
                        <div v-if="options.closable" class="button-container srow">
                            <button class="four columns offset-by-eight" @click="close()" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';

    let defaultOptions = {
        header: '',
        closable: false,
        cancelFn: null,
        text: ''
    }

    export default {
        props: [],
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
        mounted() {
        }
    }
</script>

<style scoped>
    .biggerFont {
        font-size: 1.3em;
    }
</style>