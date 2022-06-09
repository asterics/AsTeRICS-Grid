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
                    <option :value="undefined">{{ $t('noneSelected') }}</option>
                    <option v-for="category in colorCategories" :value="category">{{ category | translate }}</option>
                </select>
            </div>
        </div>
        <div class="srow mt-5">
            <div class="six columns">
                <label for="backgroundColor">{{ $t('customBackgroundColor') }}</label>
                <input class="mx-2" type="color" id="backgroundColor" v-if="gridElement" v-model="backgroundColor" @change="changeColor()"/>
                <button class="inline" @click="gridElement.backgroundColor = null; backgroundColor = metadata.colorConfig.elementBackgroundColor;">{{ $t('clear') }}</button>
            </div>
            <div class="six columns">
                <a href="javascript:;" v-if="gridElement.colorCategory && gridElement.backgroundColor" @click="gridElement.colorCategory = undefined">{{ $t('disableColorCategoryToEnableCustomColor') }}</a>
            </div>
        </div>
        <div class="srow">
            <div class="three columns">
                <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden"/>
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
    import {dataService} from "../../js/service/data/dataService.js";
    import {MetaData} from "../../js/model/MetaData.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                metadata: null,
                currentLang: i18nService.getCurrentLang(),
                colorCategories: [],
                backgroundColor: null,
                constants: constants
            }
        },
        methods: {
            changeColor() {
                this.gridElement.backgroundColor = this.backgroundColor;
            }
        },
        mounted() {
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            dataService.getMetadata().then(metadata => {
                this.metadata = metadata;
                this.backgroundColor = this.gridElement.backgroundColor || metadata.colorConfig.elementBackgroundColor;
                this.colorCategories = MetaData.getActiveColorScheme(metadata).categories;
                if (!this.colorCategories.includes(this.gridElement.colorCategory)) {
                    this.gridElement.colorCategory = undefined;
                }
            })
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