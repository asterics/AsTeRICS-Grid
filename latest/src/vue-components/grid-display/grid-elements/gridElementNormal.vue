<template>
    <div class="grid-item-content">
        <grid-element-image :metadata="metadata" :grid-image="gridElement.image"/>
        <grid-element-text-container :with-image="!!imageData" :metadata="metadata" :grid-element="gridElement" v-bind="$attrs"/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';
import GridElementImage from './gridElementImage.vue';

export default {
    components: { GridElementImage, GridElementTextContainer },
    props: ["gridElement", "metadata"],
    data() {
        return {
            TextConfig: TextConfig
        }
    },
    computed: {
        imageData() {
            return this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null;
        },
    },
    methods: {
    },
    mounted() {
    }
}
</script>

<style scoped>
</style>