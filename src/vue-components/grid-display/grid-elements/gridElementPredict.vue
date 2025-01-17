<template>
    <div ref="container" class="grid-item-content" style="background-color: rgb(255,228,178);">
        <grid-element-text-container :with-image="false" :metadata="metadata" :container-size="containerSize" :container="$refs.container" :watch-id="watchId" :disable-auto-size-keyboard="true"/>
    </div>
</template>

<script>

import GridElementTextContainer from './gridElementTextContainer.vue';

export default {
    components: { GridElementTextContainer },
    props: ["metadata", "containerSize", "watchId"],
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