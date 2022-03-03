<template>
    <div class="row">
        <div class="four columns">
            <label for="inputAREURI" class="normal-text">{{ $t('areUrl') }}</label>
        </div>
        <div class="eight columns">
            <div class="row nomargin">
                <input id="inputAREURI" class="six columns" type="text" v-model="areURL" @change="fixAreUrl()"/>
                <div class="six columns">
                    <button @click="testAREUrl()" style="width: 70%"><i class="fas fa-bolt"/> <span>{{ $t('testUrl') }}</span></button>
                    <span class="spaced" v-show="areConnected === undefined"><i class="fas fa-spinner fa-spin"/></span>
                    <span class="spaced" v-show="areConnected" style="color: green"><i class="fas fa-check"/></span>
                    <span class="spaced" v-show="areConnected === false" style="color: red"><i class="fas fa-times"/></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {areService} from './../../../js/service/areService'
    import {i18nService} from "../../../js/service/i18nService";

    export default {
        props: ['areURLProp'],
        data: function () {
            return {
                areConnected: null,
                areURL: null
            }
        },
        methods: {
            testAREUrl() {
                let thiz = this;
                this.areURL = areService.getRestURL(this.areURL);
                this.updateValue();
                this.areConnected = undefined;
                areService.getModelName(this.areURL).then(() => {
                    thiz.areConnected = true;
                }).catch(() => {
                    thiz.areConnected = false;
                });
            },
            fixAreUrl() {
                this.areURL = areService.getRestURL(this.areURL);
                this.updateValue();
            },
            updateValue() {
                this.$emit('input', this.areURL);
            }
        },
        mounted () {
            this.areURL = this.areURLProp || areService.getRestURL();
            log.warn(this.areURL);
            this.updateValue();
        }
    }
</script>

<style scoped>
    .normal-text {
        font-weight: normal;
    }
</style>