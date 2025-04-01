<template>
    <div :style="`position: absolute; right: 0; color: ${hintsColor}; top: ${topPx}; bottom: ${bottomPx}; line-height: 1`">
        <i v-if="gridElement.hidden" class="fas fa-eye-slash element-hint"></i>
        <i v-if="hasNavigation" class="fas fa-sticky-note fa-rotate-180 fa-flip-vertical element-hint"></i>
        <span v-if="gridElement.languageLevel && isOnEdit" class="element-hint d-inline-block" style="outline: 1px solid; padding-left: 0.25em; padding-right: 0.25em; border-radius: 2px">{{ gridElement.languageLevel }}</span>
    </div>
</template>

<script>

import { GridActionNavigate } from '../../../js/model/GridActionNavigate';
import { TextConfig } from '../../../js/model/TextConfig';
import { constants } from '../../../js/util/constants';
import { Router } from '../../../js/router';

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
            isOnEdit: Router.isOnEditPage()
        }
    },
    computed: {
        hasNavigation() {
            return !!this.gridElement.actions.find((a) => a.modelName === GridActionNavigate.getModelName());
        },
        topPx() {
            return this.metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : "unset";
        },
        bottomPx() {
            return this.metadata.textConfig.textPosition === TextConfig.TEXT_POS_ABOVE ? 0 : "unset";
        },
        hintsColor() {
            let darkMode = this.metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
            return darkMode ? "#e8e8e8" : "#7c7c7c";
        }
    },
    methods: {
    },
    mounted() {
    },
}
</script>

<style scoped>
</style>