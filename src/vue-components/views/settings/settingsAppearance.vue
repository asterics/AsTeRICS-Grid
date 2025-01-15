<template>
    <div>
        <div class="srow">
            <div class="nine columns settings-area">
                <h3 class="mt-2">{{ $t('quickSettings') }}</h3>
                <div class="srow">
                    <button @click="toDefault">{{ $t('setToDefaultSettings') }}</button>
                    <button @click="toDefaultBgColored">{{ $t('setToDefaultSettingsBgColored') }}</button>
                    <button @click="toDefaultBorderColored">{{ $t('setToDefaultSettingsBorderColored') }}</button>
                    <button @click="toDarkMode">{{ $t('setToDarkMode') }}</button>
                    <button @click="toLightMode">{{ $t('setToLightMode') }}</button>
                </div>
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
                <div class="srow mb-0">
                    <slider-input label="fontSize" unit="%" id="fontSize" min="0" max="100" step="1" v-model.number="metadata.textConfig.fontSizePct" @change="saveMetadata(metadata)"/>
                </div>
                <div class="srow mb-5">
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
                            <label class="three columns" for="fontColor">
                                <span>{{ $t('fontColor') }}</span>
                            </label>
                            <input id="fontColor" v-model="metadata.textConfig.fontColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                            <button class="three columns" @click="metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                        </div>
                        <div class="srow">
                            <input id="autoSizeKeyboardLetters" type="checkbox" v-model="metadata.textConfig.autoSizeKeyboardLetters" @change="saveMetadata(metadata)"/>
                            <label for="autoSizeKeyboardLetters">{{ $t('autoSizeKeyboardLetters') }}</label>
                        </div>
                    </accordion>
                </div>
                <h3 class="mt-5">{{ $t('gridElement') }}</h3>
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
                    <label class="three columns" for="colorMode">{{ $t('colorMode') }}</label>
                    <select id="colorMode" v-model="metadata.colorConfig.colorMode" class="five columns" @change="saveMetadata(metadata)">
                        <option :value="ColorConfig.COLOR_MODE_BACKGROUND">{{ $t('colorModeBackground') }}</option>
                        <option :value="ColorConfig.COLOR_MODE_BORDER">{{ $t('colorModeBorder') }}</option>
                    </select>
                </div>
                <div class="srow mt-5">
                    <accordion :acc-label="$t('advancedOptions')" class="eleven columns">
                        <div class="srow">
                            <label class="three columns" for="borderColor">
                                <span>{{ $t('defaultGridElementBorderColor') }}</span>
                            </label>
                            <input id="borderColor" v-model="metadata.colorConfig.elementBorderColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                            <button class="three columns" @click="metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BORDER_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                        </div>
                        <div class="srow">
                            <slider-input label="borderWidth" unit="px" id="borderWidth" min="0" max="10" step="1" v-model.number="metadata.colorConfig.borderWidth" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <slider-input label="elementMargin" unit="px" id="elementMargin" min="0" max="20" step="1" v-model.number="metadata.colorConfig.elementMargin" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <slider-input label="borderRadius" unit="px" id="borderRadius" min="0" max="20" step="1" v-model.number="metadata.colorConfig.borderRadius" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <input id="colorSchemeActive" type="checkbox" v-model="metadata.colorConfig.colorSchemesActivated" @change="saveMetadata(metadata)"/>
                            <label for="colorSchemeActive">
                                <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                            </label>
                        </div>
                    </accordion>
                </div>
            </div>
            <div class="three columns" style="height: 500px;">
                <h3 class="mt-3">{{ $t('appearanceDemo') }}</h3>
                <div class="srow">
                    <label for="testElementLabel" class="me-2">{{ $t('testElementLabel') }}</label>
                    <input id="testElementLabel" type="text" v-model="testElementLabel" @input="resetTestGrid"/>
                </div>
                <app-grid-display style="max-width: 200px" id="grid-container" :grid-data="testGridData" :metadata="metadata"/>
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
    import { ColorConfig } from '../../../js/model/ColorConfig';

    export default {
        components: { AppGridDisplay, Accordion, SliderInput },
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                TextConfig: TextConfig,
                ColorConfig: ColorConfig,
                MetaData: MetaData,
                constants: constants,
                testGridData: null,
                testElementLabel: i18nService.t("testElement"),
            }
        },
        methods: {
            toDefault() {
                this.metadata.textConfig = JSON.parse(JSON.stringify(new TextConfig()));
                this.metadata.colorConfig = JSON.parse(JSON.stringify(new ColorConfig()));
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            toDefaultBgColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BACKGROUND;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BG_COLORED
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            toDefaultBorderColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BORDER;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            toDarkMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR_DARK;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR_DARK;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            toLightMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            getColorScheme() {
                let originalScheme = this.metadata.colorConfig.activeColorScheme;
                let backgroundColored = this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BACKGROUND;
                let darkMode = this.metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                if (originalScheme.startsWith(constants.COLOR_SCHEME_FITZGERALD_PREFIX)) {
                    return backgroundColored ?
                        (darkMode ? constants.COLOR_SCHEME_FITZGERALD_DARK : constants.COLOR_SCHEME_FITZGERALD_LIGHT) :
                        constants.COLOR_SCHEME_FITZGERALD_MEDIUM;
                } else {
                    return backgroundColored ?
                        (darkMode ? constants.COLOR_SCHEME_GOOSENS_DARK : constants.COLOR_SCHEME_GOOSENS_LIGHT) :
                        constants.COLOR_SCHEME_GOOSENS_MEDIUM;
                }
            },
            getElement(x, y, label, imgUrl, colorCategory) {
                return new GridElement({
                    x: x,
                    y: y,
                    label: i18nService.getTranslationObject(label),
                    image: new GridImage({
                        url: imgUrl
                    }),
                    colorCategory: colorCategory
                });
            },
            resetTestGrid() {
                util.debounce(() => {
                    this.testGridData = new GridData({
                        gridElements: [
                            this.getElement(0, 0, this.testElementLabel, "https://api.arasaac.org/api/pictograms/2648?download=false&plural=false&color=true"),
                            this.getElement(0, 1, i18nService.t("CC_VERB"), "https://api.arasaac.org/api/pictograms/4887?download=false&plural=false&color=true", "CC_VERB"),
                            this.getElement(0, 2, i18nService.t("CC_NOUN"), "https://api.arasaac.org/api/pictograms/2808?download=false&plural=false&color=true", "CC_NOUN"),
                            this.getElement(0, 3, this.testElementLabel),
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
    .settings-area {
        border-right: 1px solid lightgray;
    }
    @media (max-width: 849px) {
        .settings-area {
            border-right: 0;
        }
    }
</style>