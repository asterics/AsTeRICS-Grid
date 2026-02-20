<template>
    <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
        <img :src="imageData" draggable="false" :crossorigin="corsActive ? 'anonymous' : null" @error="handleImageError" alt=""/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';

export default {
    components: { GridElementTextContainer },
    props: ["gridImage", "metadata"],
    data() {
        return {
            TextConfig: TextConfig,
            corsActive: true
        }
    },
    computed: {
        imageData() {
            return this.gridImage ? this.gridImage.data || this.gridImage.url : null;
        }
    },
    methods: {
        handleImageError() {
            // If the image fails to load and we were trying CORS,
            // it's likely a CORS mismatch. Try again without it.
            if (this.corsActive) {
                this.corsActive = false;
            }
        }
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