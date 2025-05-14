<template>
    <div class="grid-item-content">
        <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img v-if="useCrossOrigin" :src="imageData" draggable="false" crossorigin="anonymous" alt=""/>
            <img v-if="!useCrossOrigin" :src="imageData" draggable="false" alt=""/>
        </div>
        <grid-element-text-container :with-image="!!imageData" :metadata="metadata" :grid-element="gridElement" v-bind="$attrs"/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';

const KNOWN_IMAGE_APIS = ['https://api.arasaac.org', 'https://d18vdu4p71yql0.cloudfront.net']

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
        },
        useCrossOrigin() {
            return this.gridElement.image && this.gridElement.image.url && KNOWN_IMAGE_APIS.some(apiUrl => this.gridElement.image.url.startsWith(apiUrl));
        }
    },
    methods: {
    },
    mounted() {
    }
}
</script>

<style scoped>
.img-container img {
    box-sizing: border-box;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    padding: 2%;
}
</style>