<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('textHeading') }}</h3>
                <div class="srow">
                    <label class="three columns" for="textPos">{{ $t('textPosition') }}</label>
                    <select id="textPos" v-model="metadata.textConfig.textPosition" class="five columns" @change="saveMetadata(metadata)">
                        <option :value="TextConfig.TEXT_POS_ABOVE">{{ $t('top') }}</option>
                        <option :value="TextConfig.TEXT_POS_BELOW">{{ $t('bottom') }}</option>
                    </select>
                </div>
                <div class="srow">
                    <label class="three columns" for="fontFamily">{{ $t('fontFamily') }}</label>
                    <select id="fontFamily" v-model="metadata.textConfig.fontFamily" class="five columns" @change="saveMetadata(metadata)">
                        <option v-for="value in TextConfig.FONTS" :value="value">{{ value }}</option>
                    </select>
                </div>
                <div class="srow">
                    <label class="three columns" for="convertText">{{ $t('convertElementLabels') }}</label>
                    <select id="convertText" v-model="metadata.textConfig.convertMode" class="five columns" @change="saveMetadata(metadata)">
                        <option :value="null">{{ $t('dontConvertLabels') }}</option>
                        <option :value="TextConfig.CONVERT_MODE_UPPERCASE">{{ $t('convertToUppercasse') }}</option>
                        <option :value="TextConfig.CONVERT_MODE_LOWERCASE">{{ $t('convertToLowercase') }}</option>
                    </select>
                </div>
                <div class="srow">
                    <slider-input label="fontSize" unit="%" id="fontSize" min="0" max="100" step="1" v-model.number="metadata.textConfig.fontSizePct" @change="saveMetadata(metadata)"/>
                </div>
                <div class="srow">
                    <accordion :acc-label="$t('advancedOptions')" class="eleven columns">
                        <div class="srow">
                            <label class="three columns" for="fittingMode">{{ $t('modeForHandlingTooLongTexts') }}</label>
                            <select id="fittingMode" v-model="metadata.textConfig.fittingMode" class="five columns" @change="saveMetadata(metadata)">
                                <option :value="TextConfig.TOO_LONG_AUTO">{{ $t('adaptAutomatically') }}</option>
                                <option :value="TextConfig.TOO_LONG_TRUNCATE">{{ $t('truncate') }}</option>
                                <option :value="TextConfig.TOO_LONG_ELLIPSIS">{{ $t('ellipsisDotDotDot') }}</option>
                            </select>
                        </div>
                        <div class="srow">
                            <label class="three columns" for="maxLines">{{ $t('maximumNumberOfLines') }}</label>
                            <select id="maxLines" v-model="metadata.textConfig.maxLines" class="five columns" @change="saveMetadata(metadata)">
                                <option :value="1">1</option>
                                <option :value="2">2</option>
                                <option :value="3">3</option>
                            </select>
                        </div>
                        <div class="srow mt-3">
                            <slider-input label="lineHeight" id="lineHeight" min="1" max="3" step="0.1" v-model.number="metadata.textConfig.lineHeight" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <slider-input label="onlyTextFontSize" unit="%" id="onlyTextFontSize" min="0" max="100" step="1" v-model.number="metadata.textConfig.onlyTextFontSizePct" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow mb-2">
                            <slider-input label="onlyTextLineHeight" id="onlyTextLineHeight" min="1" max="3" step="0.1" v-model.number="metadata.textConfig.onlyTextLineHeight" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <input id="autoSizeKeyboardLetters" type="checkbox" v-model="metadata.textConfig.autoSizeKeyboardLetters" @change="saveMetadata(metadata)"/>
                            <label for="autoSizeKeyboardLetters">{{ $t('autoSizeKeyboardLetters') }}</label>
                        </div>
                    </accordion>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('colors') }}</h3>
                <div class="srow">
                    <label class="three columns" for="elemColor">
                        <span>{{ $t('defaultGridElementColor') }}</span>
                    </label>
                    <input id="elemColor" v-model="metadata.colorConfig.elementBackgroundColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                    <button class="three columns" @click="metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                </div>
                <div class="srow">
                    <label class="three columns" for="appColor">
                        <span>{{ $t('defaultGridBackgroundColor') }}</span>
                    </label>
                    <input id="appColor" v-model="metadata.colorConfig.gridBackgroundColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                    <button class="three columns" @click="metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                </div>
                <div class="srow">
                    <label class="three columns" for="colorScheme">
                        <span>{{ $t('colorSchemeForCategories') }}</span>
                    </label>
                    <select id="colorScheme" class="five columns" v-model="metadata.colorConfig.activeColorScheme" @change="saveMetadata(metadata)">
                        <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{scheme.name | translate}}</option>
                    </select>
                </div>
                <div class="srow">
                    <div class="five columns offset-by-three d-flex" style="height: 1.5em">
                        <div class="flex-grow-1" v-for="(color, index) in MetaData.getActiveColorScheme(metadata).colors" :title="$t(MetaData.getActiveColorScheme(metadata).categories[index])" :style="`background-color: ${color};`"></div>
                    </div>
                </div>
                <div class="srow">
                    <input id="colorSchemeActive" type="checkbox" v-model="metadata.colorConfig.colorSchemesActivated" @change="saveMetadata(metadata)"/>
                    <label for="colorSchemeActive">
                        <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns" style="height: 400px; max-width: 600px;">
                <h3 class="mt-2">{{ $t('appearanceDemo') }}</h3>
                <div class="srow">
                    <label for="testElementLabel" class="me-2">{{ $t('testElementLabel') }}</label>
                    <input id="testElementLabel" type="text" v-model="testElementLabel" @input="resetTestGrid"/>
                </div>
                <app-grid-display id="grid-container" :grid-data="testGridData" :metadata="metadata"/>
            </div>
        </div>
    </div>
</template>

<script>
    import { TextConfig } from '../../../js/model/TextConfig';
    import { MetaData } from '../../../js/model/MetaData';
    import { constants } from '../../../js/util/constants';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import SliderInput from '../../modals/input/sliderInput.vue';
    import Accordion from '../../components/accordion.vue';
    import AppGridDisplay from '../../grid-display/appGridDisplay.vue';
    import { GridElement } from '../../../js/model/GridElement';
    import { i18nService } from '../../../js/service/i18nService';
    import { GridImage } from '../../../js/model/GridImage';
    import { GridData } from '../../../js/model/GridData';
    import { util } from '../../../js/util/util';

    export default {
        components: { AppGridDisplay, Accordion, SliderInput },
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                TextConfig: TextConfig,
                MetaData: MetaData,
                constants: constants,
                testGridData: null,
                testElementLabel: "Test Element",
            }
        },
        methods: {
            getElement(x, y, label, imgUrl) {
                return new GridElement({
                    x: x,
                    y: y,
                    label: i18nService.getTranslationObject(label),
                    image: new GridImage({
                        url: imgUrl
                    })
                });
            },
            resetTestGrid() {
                util.debounce(() => {
                    this.testGridData = new GridData({
                        gridElements: [
                            this.getElement(0, 0, this.testElementLabel, "https://api.arasaac.org/api/pictograms/2648?download=false&plural=false&color=true"),
                            this.getElement(1, 0, "Test", "https://api.arasaac.org/api/pictograms/4887?download=false&plural=false&color=true"),
                            this.getElement(0, 1, "Test", "https://api.arasaac.org/api/pictograms/2808?download=false&plural=false&color=true"),
                            this.getElement(1, 1, this.testElementLabel),
                        ]
                    });
                }, 200, "RESET_TEST_GRD");

            }
        },
        async mounted() {
            this.resetTestGrid();
        }
    }
</script>

<style scoped>
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
</style>