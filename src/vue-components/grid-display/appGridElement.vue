<template>
    <div class="element-container" :id="element.id" tabindex="40" :aria-label="getAriaLabel(element)" :data-empty="isEmpty(element)" :style="`margin: 2px; border-radius: 3px; cursor: pointer; border: 1px solid ${getBorderColor()}; background-color: ${getBackgroundColor(element)};`">
        <grid-element-normal v-if="element.type === GridElement.ELEMENT_TYPE_NORMAL" :grid-element="element" :metadata="metadata" aria-hidden="true"/>
        <grid-element-collect v-if="element.type === GridElement.ELEMENT_TYPE_COLLECT" aria-hidden="true"/>
        <grid-element-youtube v-if="element.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="element" aria-hidden="true"/>
        <grid-element-predict v-if="element.type === GridElement.ELEMENT_TYPE_PREDICTION" aria-hidden="true"/>
        <grid-element-hints :grid-element="element"/>
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

export default {
    components: { GridElementNormal, GridElementYoutube, GridElementCollect, GridElementHints, GridElementPredict },
    props: ["element", "metadata", "showResizeHandle"],
    data() {
        return {
            GridElement: GridElement
        }
    },
    methods: {
        getBorderColor() {
            let backgroundColor = this.metadata && this.metadata.colorConfig ? this.metadata.colorConfig.gridBackgroundColor : '#ffffff';
            return fontUtil.getHighContrastColor(backgroundColor, 'whitesmoke', 'gray');
        },
        getBackgroundColor(element) {
            return MetaData.getElementColor(element, this.metadata);
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
        }
    },
    mounted() {
    },
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