<template>
    <div v-if="element.type !== GridElement.ELEMENT_TYPE_UI_FILLER" role="button" class="element-container" ref="container" tabindex="40" :aria-label="getAriaLabel(element)" :data-empty="isEmpty(element)"
         :style="`margin: ${elementMarginPx}px; border-radius: ${borderRadiusPx}px; cursor: ${cursorType};
         border: ${borderWidthPx}px solid ${borderColor}; background-color: ${backgroundColor}; font-family: ${metadata.textConfig.fontFamily}; color: ${fontColor}`">
        <grid-element-normal v-if="element.type === GridElement.ELEMENT_TYPE_NORMAL" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-collect v-if="element.type === GridElement.ELEMENT_TYPE_COLLECT" :metadata="metadata" aria-hidden="true"/>
        <grid-element-youtube v-if="element.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="element" aria-hidden="true"/>
        <grid-element-predict v-if="element.type === GridElement.ELEMENT_TYPE_PREDICTION" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-live v-if="element.type === GridElement.ELEMENT_TYPE_LIVE" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" v-bind="$props" aria-hidden="true"/>
        <grid-element-matrix-conversation v-if="element.type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION" :grid-element="element" :metadata="metadata" :container-size="calculatedSize" aria-hidden="true"/>
        <grid-element-child-placeholder v-if="element.type === GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER"/>
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
import GridElementChildPlaceholder from './grid-elements/gridElementChildPlaceholder.vue';
import {colorUtil} from "../../js/util/colorUtil";

export default {
    components: { GridElementChildPlaceholder, GridElementMatrixConversation, GridElementLive, GridElementNormal, GridElementYoutube, GridElementCollect, GridElementHints, GridElementPredict },
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
            return colorUtil.getBackgroundColor(this.element, this.metadata);
        },
        fontColor() {
            return colorUtil.getFontColor(this.metadata, this.backgroundColor);
        },
        borderColor() {
            return colorUtil.getBorderColor(this.element, this.metadata);
        },
        cursorType() {
            return gridUtil.getCursorType(this.metadata, "pointer");
        }
    },
    methods: {
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