<template>
    <div class="grid-item-content">
        <div v-if="stopClicking" id="youtubeClickPreventer" onclick="event.stopPropagation()" style="z-index: 100; position: absolute; top: 0; bottom: 0; left: 0; right: 0; height: 100%; width: 100%"></div>
        <div class="yt-container" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
            <div id="player" style="height: 100%; background-color: black; display: flex; align-items: center; justify-content: center;">
                <i class="fab fa-youtube fa-5x" style="color: whitesmoke"></i>
            </div>
        </div>
    </div>
</template>

<script>

import { GridElement } from '../../../js/model/GridElement';

export default {
    props: ["gridElement"],
    data() {
        return {
            stopClicking: this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]
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