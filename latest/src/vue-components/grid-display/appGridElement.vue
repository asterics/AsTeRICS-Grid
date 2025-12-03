<template>
    <div class="element-container" ref="container" tabindex="40" :aria-label="getAriaLabel(element)" :data-empty="isEmpty(element)"
         :style="`margin: ${elementMarginPx}px; border-radius: ${borderRadiusPx}px; cursor: ${cursorType};
         border: ${borderWidthPx}px solid ${getBorderColor(element)}; background-color: ${backgroundColor}; font-family: ${metadata.textConfig.fontFamily}; color: ${fontColor}`">
        <grid-element-normal v-if="element.type === GridElement.ELEMENT_TYPE_NORMAL" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-collect v-if="element.type === GridElement.ELEMENT_TYPE_COLLECT" aria-hidden="true"/>
        <grid-element-youtube v-if="element.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="element" aria-hidden="true"/>
        <grid-element-predict v-if="element.type === GridElement.ELEMENT_TYPE_PREDICTION" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-live v-if="element.type === GridElement.ELEMENT_TYPE_LIVE" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-matrix-conversation v-if="element.type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" aria-hidden="true"/>
        <grid-element-hints :grid-element="element" :metadata="metadata" :background-color="backgroundColor"/>
        <div v-if="showResizeHandle" class="ui-resizable-handle ui-icon ui-icon-grip-diagonal-se" style="position: absolute; z-index: 2; bottom: 0; right: 0; cursor: se-resize;"></div>
    </div>
</template>

<script>

import { GridElement as GridElementModel, GridElement } from '../../js/model/GridElement';
import GridElementPredict from './grid-elements/gridElementPredict.vue';
import GridElementHints from './grid-elements/gridElementHints.vue';
import GridElementCollect from './grid-elements/gridElementCollect.vue';
import GridElementYoutube from './grid-elements/gridElementYoutube.vue';
import GridElementNormal from './grid-elements/gridElementNormal.vue';
import { constants } from '../../js/util/constants';
import { fontUtil } from '../../js/util/fontUtil';
import { MetaData } from '../../js/model/MetaData';
import { stateService } from '../../js/service/stateService';
import { i18nService } from '../../js/service/i18nService';
import { GridActionSpeakCustom } from '../../js/model/GridActionSpeakCustom';
import { GridActionSpeak } from '../../js/model/GridActionSpeak';
import { GridActionPredict } from '../../js/model/GridActionPredict';
import { GridActionChangeLang } from '../../js/model/GridActionChangeLang';
import { GridActionCollectElement } from '../../js/model/GridActionCollectElement';
import { GridActionNavigate } from '../../js/model/GridActionNavigate';
import { GridActionWebradio } from '../../js/model/GridActionWebradio';
import { GridActionYoutube } from '../../js/model/GridActionYoutube';
import { ColorConfig } from '../../js/model/ColorConfig';
import GridElementLive from './grid-elements/gridElementLive.vue';
import GridElementMatrixConversation from './grid-elements/gridElementMatrixConversation.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { GridElementMatrixConversation, GridElementLive, GridElementNormal, GridElementYoutube, GridElementCollect, GridElementHints, GridElementPredict },
    props: ["element", "metadata", "showResizeHandle", "editable", "oneElementSize", "watchForChanges"],
    data() {
        return {
            GridElement: GridElement,
            resizeObserver: null,
            elementMarginPx: fontUtil.pctToPx(this.metadata.colorConfig.elementMargin),
            borderRadiusPx: fontUtil.pctToPx(this.metadata.colorConfig.borderRadius),
            borderWidthPx: fontUtil.pctToPx(this.metadata.colorConfig.borderWidth)
        }
    },
    computed: {
        calculatedSize() {
            return {
                width: this.oneElementSize.width * this.element.width - 2 * this.getElementMargin() - 2 * this.getBorderWidth(),
                height: this.oneElementSize.height * this.element.height - 2 * this.getElementMargin() - 2 * this.getBorderWidth()
            }
        },
        backgroundColor() {
            if (!this.metadata || !this.element) {
                return '';
            }
            if (this.element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                return constants.COLORS.PREDICT_BACKGROUND;
            }
            if (this.element.type === GridElement.ELEMENT_TYPE_LIVE) {
                return this.element.backgroundColor || constants.COLORS.LIVE_BACKGROUND;
            }
            if ([ColorConfig.COLOR_MODE_BACKGROUND, ColorConfig.COLOR_MODE_BOTH].includes(this.metadata.colorConfig.colorMode)) {
                return MetaData.getElementColor(this.element, this.metadata);
            }
            return this.metadata.colorConfig.elementBackgroundColor;
        },
        fontColor() {
            if (!this.metadata || !this.metadata.textConfig) {
                return constants.COLORS.BLACK;
            }
            if (!this.metadata.textConfig.fontColor ||
                [constants.COLORS.BLACK, constants.COLORS.WHITE].includes(this.metadata.textConfig.fontColor)) {
                // if not set or set to black or white - do auto-contrast
                let isDark = fontUtil.isHexDark(this.backgroundColor);
                return isDark ? constants.COLORS.WHITE : constants.COLORS.BLACK;
            }
            return this.metadata.textConfig.fontColor;
        },
        cursorType() {
            return gridUtil.getCursorType(this.metadata, "pointer");
        }
    },
    methods: {
        getBorderColor(element) {
            if (!this.metadata || !this.metadata.colorConfig) {
                return constants.COLORS.GRAY;
            }

            if (this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH && element.borderColor) {
                // element.borderColor only used for color mode "both", see https://github.com/asterics/AsTeRICS-Grid/issues/580#issuecomment-3281187917
                return element.borderColor;
            }

            let color = this.metadata.colorConfig.elementBorderColor;
            if (this.metadata.colorConfig.elementBorderColor === constants.DEFAULT_ELEMENT_BORDER_COLOR) {
                let backgroundColor = this.metadata.colorConfig.gridBackgroundColor || constants.COLORS.WHITE;
                color = fontUtil.getHighContrastColor(backgroundColor, constants.COLORS.WHITESMOKE, constants.COLORS.GRAY);
            }
            if (this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER) {
                return MetaData.getElementColor(element, this.metadata, color);
            }
            if (this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH) {
                if (!element.colorCategory) {
                    return 'transparent';
                }
                let colorScheme = MetaData.getUseColorScheme(this.metadata);
                if (colorScheme && colorScheme.customBorders && colorScheme.customBorders[element.colorCategory]) {
                    return colorScheme.customBorders[element.colorCategory];
                }
                let absAdjustment = 40;
                let bgColor = MetaData.getElementColor(element, this.metadata, color);
                let adjustment = fontUtil.isHexDark(bgColor) ? absAdjustment * 1.5 : absAdjustment * -1;
                return fontUtil.adjustHexColor(bgColor, adjustment);
            }
            return color;
        },
        isEmpty(element) {
            if (element.type === GridElementModel.ELEMENT_TYPE_NORMAL) {
                return !stateService.getDisplayText(element.id) && (!element.image || (!element.image.url && !element.image.data));
            }
            return false;
        },
        getAriaLabel(gridElem) {
            let label = i18nService.getTranslation(gridElem.label);
            let ariaLabel = label ? label + ', ' : '';
            let singleCharMapping = {
                ':': 'colon',
                '.': 'period',
                ',': 'comma',
                '!': 'exclamationMark',
                '?': 'questionMark',
                '"': 'quotationMark',
                '-': 'hyphen',
                ' ': 'space'
            };

            if (Object.keys(singleCharMapping).includes(label)) {
                ariaLabel = i18nService.t(singleCharMapping[label]) + ', ';
            }

            let speakCustomAction = gridElem.actions.filter((a) => a.modelName === GridActionSpeakCustom.getModelName())[0];
            if (!ariaLabel && speakCustomAction) {
                ariaLabel = i18nService.getTranslation(speakCustomAction.speakText) + ', ';
            }

            let actions = gridElem.actions.filter(
                (a) =>
                    a.modelName !== GridActionSpeak.getModelName() &&
                    a.modelName !== GridActionSpeakCustom.getModelName() &&
                    a.modelName !== GridActionPredict.getModelName()
            );
            ariaLabel += actions.reduce((total, action) => {
                switch (action.modelName) {
                    case GridActionChangeLang.getModelName():
                        total += i18nService.t(GridActionChangeLang.getModelName());
                        total += ' ' + i18nService.getLangReadable(action.language);
                        total += ', ';
                        break;
                    case GridActionCollectElement.getModelName():
                        total += i18nService.t(action.action);
                        total += ', ';
                        break;
                    case GridActionNavigate.getModelName():
                        if (action.navType === GridActionNavigate.NAV_TYPES.TO_LAST) {
                            total += i18nService.t('navigateToLastOpenedGrid');
                        } else if (action.navType === GridActionNavigate.NAV_TYPES.TO_HOME) {
                            total += i18nService.t('navigateToHomeGrid');
                        } else {
                            total += i18nService.t('navigation');
                        }
                        total += ', ';
                        break;
                    case GridActionWebradio.getModelName():
                        total += i18nService.t(GridActionWebradio.getModelName());
                        total += ' ' + i18nService.t(action.action);
                        total += ', ';
                        break;
                    case GridActionYoutube.getModelName():
                        total += i18nService.t(GridActionYoutube.getModelName());
                        total += ' ' + i18nService.t(action.action);
                        total += ', ';
                        break;
                    default:
                        total += i18nService.t(action.modelName);
                        total += ', ';
                        break;
                }
                return total;
            }, '');
            if (ariaLabel.endsWith(', ')) {
                ariaLabel = ariaLabel.slice(0, -2);
            }
            return ariaLabel;
        },
        async recalculate() {
            if (!this.$refs.container) {
                return;
            }
            this.elementMarginPx = this.getElementMargin();
            this.borderWidthPx = this.getBorderWidth();
            this.borderRadiusPx = fontUtil.pctToPx(this.metadata.colorConfig.borderRadius);
        },
        getElementMargin() {
            return fontUtil.pctToPx(this.metadata.colorConfig.elementMargin);
        },
        getBorderWidth() {
            return fontUtil.pctToPx(this.metadata.colorConfig.borderWidth);
        }
    },
    async mounted() {
        if (this.editable || this.watchForChanges) {
            this.$watch("metadata", () => {
                this.recalculate();
            }, { deep: true });
            this.$watch("element", () => {
                this.recalculate();
            }, { deep: true });
        }
    }
}
</script>

<style scoped>
.element-container {
    display: flex;
    flex: 1 1 auto;
    overflow: hidden;
    position: relative;
}
</style>