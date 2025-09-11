<template>
    <div>
        <div class="srow">
            <div class="nine columns settings-area">
                <h3 class="mt-2">{{ $t('quickSettings') }}</h3>
                <div class="srow">
                    <button @click="toDefault"><span class="fas fa-undo"/> {{ $t('setToDefaultSettings') }}</button>
                    <button @click="toDefaultBgColored"><span class="fas fa-square"/> {{ $t('setToDefaultSettingsBgColored') }}</button>
                    <button @click="toDefaultBorderColored"><span class="far fa-square"/> {{ $t('setToDefaultSettingsBorderColored') }}</button>
                    <button @click="toDefaultBothColored"><span class="fas fa-square"/><span class="far fa-square"/> {{ $t('setToDefaultSettingsBothColored') }}</button>
                    <button @click="toDarkMode"><span class="fas fa-moon"/> {{ $t('setToDarkMode') }}</button>
                    <button @click="toLightMode"><span class="fas fa-sun"/> {{ $t('setToLightMode') }}</button>
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
                    <slider-input label="fontSizeTextAndImage" unit="%" id="fontSizeTextAndImage" min="0" max="100" step="1" v-model.number="metadata.textConfig.fontSizePct" @change="saveMetadata(metadata)"/>
                </div>
                <div class="srow">
                    <slider-input label="onlyTextFontSize" unit="%" id="onlyTextFontSize" min="0" max="100" step="1" v-model.number="metadata.textConfig.onlyTextFontSizePct" @change="saveMetadata(metadata)"/>
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
                    <label class="three columns" for="colorMode">{{ $t('colorMode') }}</label>
                    <select id="colorMode" v-model="metadata.colorConfig.colorMode" class="five columns" @change="saveMetadata(metadata)">
                        <option :value="ColorConfig.COLOR_MODE_BACKGROUND">{{ $t('colorModeBackground') }}</option>
                        <option :value="ColorConfig.COLOR_MODE_BORDER">{{ $t('colorModeBorder') }}</option>
                        <option :value="ColorConfig.COLOR_MODE_BOTH">{{ $t('colorModeBackgroundBorder') }}</option>
                    </select>
                </div>
                <div class="srow mt-5">
                    <accordion :acc-label="$t('advancedOptions')" class="eleven columns">
                        <div class="srow">
                            <label class="three columns" for="borderColor">
                                <span>{{ $t('defaultGridElementBorderColor') }}</span>
                            </label>
                            <input id="borderColor" v-model="metadata.colorConfig.elementBorderColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                            <button class="three columns" @click="metadata.colorConfig.elementBorderColor = constants.DEFAULT_ELEMENT_BORDER_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                        </div>
                        <div class="srow">
                            <slider-input label="borderWidth" unit="%" id="borderWidth" min="0" max="2" step="0.05" :decimals="2" e v-model.number="metadata.colorConfig.borderWidth" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <slider-input label="elementMargin" unit="%" id="elementMargin" min="0" max="2" step="0.05" :decimals="2" v-model.number="metadata.colorConfig.elementMargin" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <slider-input label="borderRadius" unit="%" id="borderRadius" min="0" max="4" step="0.05" :decimals="2" v-model.number="metadata.colorConfig.borderRadius" @change="saveMetadata(metadata)"/>
                        </div>
                        <div class="srow">
                            <label class="three columns" for="colorScheme">
                                <span>{{ $t('colorSchemeForCategories') }}</span>
                            </label>
                            <select id="colorScheme" class="three columns" v-model="metadata.colorConfig.activeColorScheme" @change="saveMetadata(metadata)">
                                <optgroup :label="$t('predefinedSchemes')">
                                    <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{scheme.name | translate}}</option>
                                </optgroup>
                                <optgroup v-if="customColorSchemes.length > 0" :label="$t('customSchemes')">
                                    <option v-for="scheme in customColorSchemes" :value="scheme.name">{{scheme.displayName}}</option>
                                </optgroup>
                            </select>
                            <div class="two columns custom-scheme-buttons">
                                <button
                                    class="large-blue-button"
                                    @click="createCustomScheme"
                                    :title="$t('createCustomScheme')"
                                    style="padding: 12px 16px !important; background: #007bff !important; color: white !important; border: 1px solid #007bff !important; font-size: 16px !important; margin-left: 8px !important; height: 48px !important; min-width: 48px !important;"
                                >
                                    <i class="fas fa-plus" style="font-size: 14px !important;"></i>
                                </button>
                                <button
                                    class="large-blue-button"
                                    @click="editCurrentScheme"
                                    :disabled="!isCurrentSchemeCustom"
                                    :title="isCurrentSchemeCustom ? $t('editCurrentScheme') : $t('cannotEditPredefinedScheme')"
                                    style="padding: 12px 16px !important; background: #007bff !important; color: white !important; border: 1px solid #007bff !important; font-size: 16px !important; margin-left: 8px !important; height: 48px !important; min-width: 48px !important;"
                                >
                                    <i class="fas fa-pencil-alt" style="font-size: 14px !important;"></i>
                                </button>
                            </div>
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
                    </accordion>
                </div>
            </div>
            <div class="three columns">
                <h3 class="mt-3">{{ $t('appearanceDemo') }}</h3>
                <div class="srow">
                    <label for="testElementLabel" class="me-2 u-full-width">{{ $t('testElementLabel') }}</label>
                    <input id="testElementLabel" class="u-full-width" type="text" v-model="testElementLabel" @input="resetTestGrid"/>
                </div>
                <app-grid-display v-if="testGridData" style="max-width: 200px; height: 500px;" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
            </div>
        </div>

        <!-- Custom Color Scheme Modal -->
        <custom-color-scheme-modal
            v-if="showCustomSchemeModal"
            :scheme="editingScheme"
            :additional-color-schemes="metadata.colorConfig.additionalColorSchemes || []"
            @save="onCustomSchemeSaved"
            @close="closeCustomSchemeModal"
        />
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
    import CustomColorSchemeModal from '../../modals/customColorSchemeModal.vue';

    export default {
        components: { AppGridDisplay, Accordion, SliderInput, CustomColorSchemeModal },
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
                showCustomSchemeModal: false,
                editingScheme: null
            }
        },
        computed: {
            customColorSchemes() {
                return this.metadata.colorConfig.additionalColorSchemes || [];
            },
            isCurrentSchemeCustom() {
                return this.metadata.colorConfig.activeColorScheme &&
                       this.metadata.colorConfig.activeColorScheme.startsWith(constants.COLOR_SCHEME_CUSTOM_PREFIX);
            }
        },
        methods: {
            toDefault() {
                this.metadata.textConfig = JSON.parse(JSON.stringify(new TextConfig()));
                this.metadata.colorConfig = JSON.parse(JSON.stringify(new ColorConfig()));
                this.saveMetadata(this.metadata);
            },
            toDefaultBgColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BACKGROUND;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BG_COLORED
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDefaultBorderColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BORDER;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDefaultBothColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BOTH;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDarkMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR_DARK;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR_DARK;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toLightMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            getColorScheme() {
                let originalScheme = this.metadata.colorConfig.activeColorScheme;
                let borderColored = this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER;
                let backgroundColored = this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BACKGROUND;
                let darkMode = this.metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                if (originalScheme.startsWith(constants.COLOR_SCHEME_FITZGERALD_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_FITZGERALD_DARK: constants.COLOR_SCHEME_FITZGERALD_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_FITZGERALD_MEDIUM;
                    }
                    // both colored
                    return darkMode ? constants.COLOR_SCHEME_FITZGERALD_DARK : constants.COLOR_SCHEME_FITZGERALD_VERY_LIGHT;
                } else if (originalScheme.startsWith(constants.COLOR_SCHEME_GOOSENS_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_GOOSENS_DARK: constants.COLOR_SCHEME_GOOSENS_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_GOOSENS_MEDIUM;
                    }
                    // both colored
                    return darkMode ? constants.COLOR_SCHEME_GOOSENS_DARK : constants.COLOR_SCHEME_GOOSENS_VERY_LIGHT;
                } else if (originalScheme.startsWith(constants.COLOR_SCHEME_MONTESSORI_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_MONTESSORI_DARK: constants.COLOR_SCHEME_MONTESSORI_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_MONTESSORI_MEDIUM;
                    }
                    // both colored
                    return darkMode ? constants.COLOR_SCHEME_MONTESSORI_DARK: constants.COLOR_SCHEME_MONTESSORI_VERY_LIGHT;
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

            },
            createCustomScheme() {
                // Pre-select current active theme as base scheme
                let currentScheme = MetaData.getActiveColorScheme(this.metadata);
                let baseSchemeType = 'FITZGERALD'; // default

                if (currentScheme) {
                    if (currentScheme.name.includes('GOOSENS')) {
                        baseSchemeType = 'GOOSENS';
                    } else if (currentScheme.name.includes('MONTESSORI')) {
                        baseSchemeType = 'MONTESSORI';
                    }
                }

                this.editingScheme = { baseSchemeType }; // Pass base scheme type
                this.showCustomSchemeModal = true;
            },
            editCurrentScheme() {
                if (!this.isCurrentSchemeCustom) {
                    return;
                }

                let currentScheme = this.customColorSchemes.find(
                    scheme => scheme.name === this.metadata.colorConfig.activeColorScheme
                );

                if (currentScheme) {
                    this.editingScheme = currentScheme;
                    this.showCustomSchemeModal = true;
                }
            },

            async onCustomSchemeSaved(updatedAdditionalColorSchemes, activeSchemeId) {
                try {
                    // Update the metadata with the new additional color schemes
                    this.metadata.colorConfig.additionalColorSchemes = updatedAdditionalColorSchemes;

                    // Set active scheme if provided
                    if (activeSchemeId) {
                        this.metadata.colorConfig.activeColorScheme = activeSchemeId;
                    }

                    // Save metadata using the mixin
                    await this.saveMetadata(this.metadata);

                    this.showCustomSchemeModal = false;
                    this.editingScheme = null;
                } catch (error) {
                    console.error('Error saving custom schemes:', error);
                }
            },
            closeCustomSchemeModal() {
                this.showCustomSchemeModal = false;
                this.editingScheme = null;
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

    .button-small {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
        margin-right: 0.5rem;
        border: 1px solid #ccc;
        background-color: #f8f9fa;
        color: #333;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
    }

    .button-small:hover:not(:disabled) {
        background-color: #e9ecef;
        border-color: #adb5bd;
    }

    .button-small:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .me-2 {
        margin-right: 0.5rem;
    }

    .color-scheme-button {
        padding: 0.8rem 1.2rem !important;
        font-size: 1.2rem !important;
        margin-left: 0.5rem !important;
        background-color: #007bff !important;
        color: white !important;
        border: 1px solid #007bff !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        min-width: 50px !important;
        height: 45px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .color-scheme-button:hover:not(:disabled) {
        background-color: #0056b3 !important;
        border-color: #0056b3 !important;
        transform: translateY(-1px) !important;
    }

    .color-scheme-button:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        background-color: #6c757d !important;
        border-color: #6c757d !important;
    }

    .color-scheme-button i {
        font-size: 1.1rem !important;
    }
</style>