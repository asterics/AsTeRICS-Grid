<template>
    <span :style="`position: absolute; right: 0; color: ${hintsColor}; line-height: 0; top: ${topPx}; bottom: ${bottomPx}`">
        <i v-if="gridElement.hidden" class="fas fa-eye-slash element-hint"></i>
        <i v-if="hasNavigation" class="fas fa-sticky-note fa-rotate-180 fa-flip-vertical element-hint"></i>
    </span>
</template>

<script>

import { GridActionNavigate } from '../../../js/model/GridActionNavigate';
import { TextConfig } from '../../../js/model/TextConfig';
import { constants } from '../../../js/util/constants';

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
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