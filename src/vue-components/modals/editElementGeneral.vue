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
        <div class="srow mb-5">
            <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden"/>
            <label for="inputHidden">{{ $t('hideElement') }}</label>
        </div>
        <div class="srow">
            <accordion :acc-label="$t('advancedOptions')">
                <div class="srow">
                    <input type="checkbox" id="inputDontCollect" v-if="gridElement" v-model="gridElement.dontCollect"/>
                    <label for="inputDontCollect">{{ $t('dontAddElementToCollectElement') }}</label>
                </div>
                <div class="srow mb-5">
                    <input type="checkbox" id="toggleInBar" v-if="gridElement" v-model="gridElement.toggleInBar"/>
                    <label for="toggleInBar">{{ $t('toggleInCollectionElementIfAddedMultipleTimes') }}</label>
                </div>
                <slider-input label="fontSize" unit="%" id="fontSize" :show-clear-button="true" min="0" max="100" step="1" v-model.number="gridElement.fontSizePct" @input="resetTestGrid"/>
                <div class="srow">
                    <label class="four columns" for="backgroundColor">{{ $t('customElementColor') }}</label>
                    <input class="five columns" type="color" id="backgroundColor" v-if="gridElement" v-model="gridElement.backgroundColor" @input="resetTestGrid"/>
                    <button class="two columns" :disabled="!gridElement.backgroundColor" @click="gridElement.backgroundColor = null; resetTestGrid();">{{ $t('clear') }}</button>
                    <div class="twelve columns mb-4" v-show="gridElement.colorCategory && gridElement.backgroundColor">
                        <a href="javascript:;" @click="gridElement.colorCategory = undefined; $forceUpdate(); resetTestGrid();">
                            <span class="fas fa-exclamation-triangle"/>
                            {{ $t('disableColorCategoryToEnableCustomColor') }}
                        </a>
                    </div>
                </div>
                <div class="srow mb-4">
                    <label class="four columns" for="fontColor">
                        <span>{{ $t('fontColor') }}</span>
                    </label>
                    <input id="fontColor" v-model="gridElement.fontColor" class="five columns" type="color" @input="resetTestGrid">
                    <button class="two columns" :disabled="!gridElement.fontColor" @click="gridElement.fontColor = null; resetTestGrid();">{{ $t('clear') }}</button>
                </div>

                <app-grid-display class="testGrid" v-if="metadata" style="max-width: 200px; height: 200px;" :grid-data="testGridData" :metadata="metadata"/>
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

    export default {
        components: { AppGridDisplay, SliderInput, Accordion },
        props: ['gridElement'],
        data: function () {
            return {
                metadata: null,
                currentLang: i18nService.getContentLang(),
                colorCategories: [],
                constants: constants,
                testGridData: null
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