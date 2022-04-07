<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-2" for="inputLabel">{{ $t('label') }}</label>
            <div class="col-sm-7">
                <input type="text" class="col-12" id="inputLabel" v-focus v-if="gridElement" v-model="gridElement.label[currentLang]"/>
            </div>
            <div class="col-sm-3">
                <button @click="$emit('searchImage')" class="col-12" :title="$t('searchForImages')"><i class="fas fa-search"/> {{$t('searchForImages')}}</button>
            </div>
        </div>
        <div class="row">
            <label class="col-sm-2" for="colorCategory">{{ $t('colorCategory') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="colorCategory" v-model="gridElement.colorCategory">
                    <option :value="null">none</option>
                    <option v-for="category in constants.COLOR_SCHEME_CATEGORIES" :value="category">{{ category | translate }}</option>
                </select>
            </div>
        </div>
        <div class="srow">
            <div class="three columns">
                <input type="checkbox" id="inputHidden" v-focus v-if="gridElement" v-model="gridElement.hidden"/>
                <label for="inputHidden">{{ $t('hideElement') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {constants} from "../../js/util/constants.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                currentLang: i18nService.getCurrentLang(),
                constants: constants
            }
        },
        methods: {
        },
        mounted() {
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }
</style>