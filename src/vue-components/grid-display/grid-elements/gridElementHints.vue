<template>
    <span style="position: absolute; right: 0; color: #5a717a; line-height: 0">
        <i v-if="gridElement.hidden" class="fas fa-eye-slash element-hint"></i>
        <i v-if="hasNavigation" class="fas fa-sticky-note fa-rotate-180 fa-flip-vertical element-hint"></i>
    </span>
</template>

<script>

import { GridActionNavigate } from '../../../js/model/GridActionNavigate';

export default {
    props: ["gridElement"],
    data() {
        return {
        }
    },
    computed: {
        hasNavigation() {
            return !!this.gridElement.actions.find((a) => a.modelName === GridActionNavigate.getModelName());
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