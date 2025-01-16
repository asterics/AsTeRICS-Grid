<template>
    <span :style="`position: absolute; right: 0; color: #5a717a; line-height: 0; top: ${topPx}; bottom: ${bottomPx}`">
        <i v-if="gridElement.hidden" class="fas fa-eye-slash element-hint"></i>
        <i v-if="hasNavigation" class="fas fa-sticky-note fa-rotate-180 fa-flip-vertical element-hint"></i>
    </span>
</template>

<script>

import { GridActionNavigate } from '../../../js/model/GridActionNavigate';
import { TextConfig } from '../../../js/model/TextConfig';

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