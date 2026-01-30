<template>
    <div ref="container" class="grid-item-content">
        <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <grid-element-text-container :with-image="!!imageData" :metadata="metadata" :disable-auto-size-keyboard="true" :grid-element="gridElement" v-bind="$attrs"/>
    </div>
</template>

<script>

import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';

export default {
    components: { GridElementTextContainer },
    props: ["gridElement", "metadata"],
    data() {
        return {
            TextConfig: TextConfig
        }
    },
    computed: {
        imageData() {
            return this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null;
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