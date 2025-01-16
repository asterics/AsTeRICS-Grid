<template>
    <div class="element-container" ref="container" tabindex="40" :aria-label="getAriaLabel(element)" :data-empty="isEmpty(element)"
         :style="`margin: ${elementMarginPx}px; border-radius: ${borderRadiusPx}px; cursor: pointer;
         border: ${borderWidthPx}px solid ${getBorderColor(element)}; background-color: ${getBackgroundColor(element)};`">
        <grid-element-normal v-if="element.type === GridElement.ELEMENT_TYPE_NORMAL" :grid-element="element" :metadata="metadata" :container-size="containerSize" aria-hidden="true"/>
        <grid-element-collect v-if="element.type === GridElement.ELEMENT_TYPE_COLLECT" aria-hidden="true"/>
        <grid-element-youtube v-if="element.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="element" aria-hidden="true"/>
        <grid-element-predict v-if="element.type === GridElement.ELEMENT_TYPE_PREDICTION" :metadata="metadata" :container-size="containerSize" :watch-id="element.id" aria-hidden="true"/>
        <grid-element-hints :grid-element="element" :metadata="metadata"/>
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
import { util } from '../../js/util/util';

export default {
    components: { GridElementNormal, GridElementYoutube, GridElementCollect, GridElementHints, GridElementPredict },
    props: ["element", "metadata", "showResizeHandle"],
    data() {
        return {
            GridElement: GridElement,
            containerSize: null,
            resizeObserver: null,
            elementMarginPx: fontUtil.pctToPx(this.metadata.colorConfig.elementMargin),
            borderRadiusPx: fontUtil.pctToPx(this.metadata.colorConfig.borderRadius),
            borderWidthPx: fontUtil.pctToPx(this.metadata.colorConfig.borderWidth)
        }
    },
    watch: {
        metadata: {
            handler() {
                this.recalculate();
            },
            deep: true
        },
        element: {
            handler() {
                this.recalculate();
            },
            deep: true
        },
    },
    methods: {
        getBorderColor(element) {
            if (!this.metadata || !this.metadata.colorConfig) {
                return 'gray';
            }
            let color = this.metadata.colorConfig.elementBorderColor;
            if (this.metadata.colorConfig.elementBorderColor === constants.DEFAULT_ELEMENT_BORDER_COLOR) {
                let backgroundColor = this.metadata.colorConfig.gridBackgroundColor || '#ffffff';
                color = fontUtil.getHighContrastColor(backgroundColor, 'whitesmoke', 'gray');
            }
            if (this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER) {
                return MetaData.getElementColor(element, this.metadata, color);
            }
            return color;
        },
        getBackgroundColor(element) {
            if (this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BACKGROUND) {
                return MetaData.getElementColor(element, this.metadata);
            }
            return this.metadata.colorConfig.elementBackgroundColor;
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
        resizeListener() {
            util.debounce(() => {
                this.recalculate();
            }, 100, "WINDOW_RESIZE_ELEM" + this.element.id);
        },
        recalculate() {
            this.containerSize = this.$refs.container.getBoundingClientRect();
            this.elementMarginPx = fontUtil.pctToPx(this.metadata.colorConfig.elementMargin);
            this.borderWidthPx = fontUtil.pctToPx(this.metadata.colorConfig.borderWidth);
            this.borderRadiusPx = fontUtil.pctToPx(this.metadata.colorConfig.borderRadius);
        },
    },
    mounted() {
        this.recalculate();
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeListener();
            });
            this.resizeObserver.observe(this.$refs.container);
        } else {
            window.addEventListener('resize', this.resizeListener);
        }
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        } else {
            window.removeEventListener('resize', this.resizeListener);
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