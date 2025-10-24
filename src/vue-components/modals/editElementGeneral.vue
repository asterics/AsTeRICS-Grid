<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-2" for="inputLabel">{{ $t('label') }}</label>
            <div class="col-sm-7">
                <input type="text" class="col-12" id="inputLabel" v-focus @keydown.enter.exact="$emit('searchImage')" v-if="gridElement" v-model="gridElement.label[currentLang]" :placeholder="gridElement.type === GridElement.ELEMENT_TYPE_LIVE ? $t('canIncludePlaceholderLike') : ''"/>
            </div>
            <div class="col-sm-3">
                <button @click="$emit('searchImage')" class="col-12 m-0" :title="$t('searchForImages')" style="line-height: 1.5"><i class="fas fa-search"/> {{$t('searchForImages')}}</button>
            </div>
        </div>
        <div class="row">
            <label class="col-sm-2" for="colorCategory">{{ $t('colorCategory') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="colorCategory" v-model="gridElement.colorCategory" @change="colorCategoryNotFitting = false">
                    <option v-if="colorCategoryNotFitting" :value="colorCategoryNotFitting" disabled selected hidden>{{ $t("categoryFromOtherColorScheme", [$t(colorCategoryNotFitting)]) }}</option>
                    <option :value="undefined">{{ $t('noneSelected') }}</option>
                    <option v-for="category in colorCategories" :value="category">{{ category | translate }}</option>
                </select>
            </div>
        </div>
        <div class="srow mb-5">
            <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden"/>
            <label for="inputHidden">{{ $t('hideElement') }}</label>
        </div>
        <div class="srow" v-if="metadata">
            <accordion :acc-label="$t('advancedOptions')">
                <div class="row">
                    <label class="col-sm-2" for="vocabularyLevel">{{ $t('vocabularyLevel') }}</label>
                    <div class="col-sm-7">
                        <select class="col-12" id="vocabularyLevel" v-model.number="gridElement.vocabularyLevel">
                            <option :value="null">{{ $t('noneSelected') }}</option>
                            <option v-for="level in [...Array(10).keys()].map(i => i + 1)" :value="level">{{ level }}</option>
                        </select>
                    </div>
                </div>
                <div class="srow">
                    <input type="checkbox" id="inputDontCollect" v-if="gridElement" v-model="gridElement.dontCollect"/>
                    <label for="inputDontCollect">{{ $t('dontAddElementToCollectElement') }}</label>
                </div>
                <div class="srow mb-5">
                    <input type="checkbox" id="toggleInBar" v-if="gridElement" v-model="gridElement.toggleInBar"/>
                    <label for="toggleInBar">{{ $t('toggleInCollectionElementIfAddedMultipleTimes') }}</label>
                </div>
                <slider-input label="fontSize" unit="%" id="fontSize" :show-clear-button="true" min="0" max="70" step="1" v-model.number="gridElement.fontSizePct" @input="resetTestGrid"/>
                <div class="srow">
                    <label class="four columns" for="backgroundColor">
                        <span v-if="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER">{{ $t('customBorderColor') }}</span>
                        <span v-if="metadata.colorConfig.colorMode !== ColorConfig.COLOR_MODE_BORDER">{{ $t('customBackgroundColor') }}</span>
                    </label>
                    <input class="five columns" type="color" id="backgroundColor" v-if="gridElement" v-model="gridElement.backgroundColor" @input="gridElement.colorCategory = undefined; resetTestGrid()"/>
                    <button class="two columns" :disabled="!gridElement.backgroundColor" @click="gridElement.backgroundColor = null; resetTestGrid();">{{ $t('clear') }}</button>
                </div>
                <div class="srow mb-4" v-if="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH">
                    <label class="four columns" for="borderColor">{{ $t('customBorderColor') }}</label>
                    <input class="five columns" type="color" id="borderColor" v-if="gridElement" v-model="gridElement.borderColor" @input="gridElement.colorCategory = undefined; resetTestGrid()"/>
                    <button class="two columns" :disabled="!gridElement.borderColor" @click="gridElement.borderColor = null; resetTestGrid();">{{ $t('clear') }}</button>
                </div>
                <div class="srow mb-4">
                    <label class="four columns" for="fontColor">
                        <span>{{ $t('fontColor') }}</span>
                    </label>
                    <input id="fontColor" v-model="gridElement.fontColor" class="five columns" type="color" @input="resetTestGrid">
                    <button class="two columns" :disabled="!gridElement.fontColor" @click="gridElement.fontColor = null; resetTestGrid();">{{ $t('clear') }}</button>
                </div>

                <app-grid-display class="testGrid" v-if="metadata" style="max-width: 200px; height: 200px;" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
            </accordion>
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
    import Accordion from '../components/accordion.vue';
    import SliderInput from './input/sliderInput.vue';
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';
    import { GridData } from '../../js/model/GridData';
    import { GridElement } from '../../js/model/GridElement';
    import { ColorConfig } from '../../js/model/ColorConfig';

    export default {
        components: { AppGridDisplay, SliderInput, Accordion },
        props: ['gridElement'],
        data: function () {
            return {
                metadata: null,
                currentLang: i18nService.getContentLang(),
                colorCategories: [],
                constants: constants,
                testGridData: null,
                GridElement: GridElement,
                ColorConfig: ColorConfig,
                colorCategoryNotFitting: false
            }
        },
        methods: {
            resetTestGrid() {
                let element = JSON.parse(JSON.stringify(this.gridElement));
                element.x = 0;
                element.y = 0;
                this.testGridData = new GridData({
                    gridElements: [element]
                });
            }
        },
        mounted() {
            this.resetTestGrid();
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            dataService.getMetadata().then(metadata => {
                this.metadata = metadata;
                this.colorCategories = MetaData.getActiveColorScheme(metadata).categories;
                if (!this.colorCategories.includes(this.gridElement.colorCategory)) {
                    this.colorCategoryNotFitting = this.gridElement.colorCategory;
                }
            })
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .row, .srow {
        margin-top: 1em;
    }
</style>