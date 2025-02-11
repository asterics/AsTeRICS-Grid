<template>
    <div ref="container" class="grid-item-content" style="background-color: rgb(255,228,178);">
        <grid-element-text-container :with-image="false" :metadata="metadata" :watch-id="watchId" :disable-auto-size-keyboard="true" v-bind="$attrs"/>
    </div>
</template>

<script>

import GridElementTextContainer from './gridElementTextContainer.vue';

export default {
    components: { GridElementTextContainer },
    props: ["metadata", "watchId"],
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