<template>
    <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
        <img v-if="useCrossOrigin" :src="imageData" draggable="false" crossorigin="anonymous" alt=""/>
        <img v-if="!useCrossOrigin" :src="imageData" draggable="false" alt=""/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';
import {constants} from '../../../js/util/constants';

export default {
    components: { GridElementTextContainer },
    props: ["gridImage", "metadata"],
    data() {
        return {
            TextConfig: TextConfig
        }
    },
    computed: {
        imageData() {
            return this.gridImage ? this.gridImage.data || this.gridImage.url : null;
        },
        useCrossOrigin() {
            return this.gridImage.data ||
                this.gridImage && this.gridImage.url && constants.KNOWN_CORS_IMAGE_APIS.some(apiUrl => this.gridImage.url.startsWith(apiUrl));
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