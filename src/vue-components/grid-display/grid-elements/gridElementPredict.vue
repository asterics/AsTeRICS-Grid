<template>
    <div ref="container" class="grid-item-content" style="background-color: rgb(255,228,178);">
        <grid-element-text-container :with-image="false" :metadata="metadata" :disable-auto-size-keyboard="true" v-bind="$attrs"/>
    </div>
</template>

<script>

import GridElementTextContainer from './gridElementTextContainer.vue';

export default {
    components: { GridElementTextContainer },
    props: ["metadata"],
    data() {
        return {
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