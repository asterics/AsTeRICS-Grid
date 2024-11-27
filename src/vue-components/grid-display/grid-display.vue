<template>
    <grid-layout class="grid-layout-container" v-if="renderGrid" :rows="renderGrid.rowCount" :columns="columns" :options="{backgroundColor: metadata.colorConfig.gridBackgroundColor, componentType: 'ol'}">
        <grid-element v-for="elem in renderGrid.gridElements" :key="elem.id" :x="elem.x" :y="elem.y" :width="elem.width" :height="elem.height" component-type="li">
            <div class="element-container" :id="elem.id" tabindex="40" :aria-label="getAriaLabel(elem)" :data-empty="isEmpty(elem)" :style="`margin: 2px; border-radius: 3px; border: 1px solid ${getBorderColor()}; background-color: ${getBackgroundColor(elem)};`">
                <grid-element-normal v-if="elem.type === GridElementModel.ELEMENT_TYPE_NORMAL" :grid-element="elem" :metadata="metadata" aria-hidden="true"/>
                <grid-element-collect v-if="elem.type === GridElementModel.ELEMENT_TYPE_COLLECT" aria-hidden="true"/>
            </div>
        </grid-element>
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import GridElementNormal from './gridElementNormal.vue';
import { gridUtil } from '../../js/util/gridUtil';
import GridElement from '../grid-layout/grid-element.vue';
import { fontUtil } from '../../js/util/fontUtil';
import { MetaData } from '../../js/model/MetaData';
import { GridElement as GridElementModel } from '../../js/model/GridElement';
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
import GridElementCollect from './gridElementCollect.vue';

export default {
    components: { GridElementCollect, GridElement, GridElementNormal, GridLayout },
    props: ["gridData", "metadata"],
    data() {
        return {
            renderGrid: null,
            columns: null,
            GridElementModel: GridElementModel
        }
    },
    watch: {
        gridData: function() {
            this.load();
        }
    },
    computed: {
    },
    methods: {
        load() {
            this.columns = gridUtil.getWidthWithBounds(this.gridData);
            this.renderGrid = this.gridData;
        },
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
        this.load();
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