<template>
    <div class="grid-item-content">
        <div class="img-container" v-if="imageData">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <div class="text-container" v-if="label" :style="`text-align: center; font-size: 14px; flex-grow: ${imageData ? '0' : '1'}`"><span>{{label}}</span></div>
    </div>
</template>

<script>
import { stateService } from '../../../js/service/stateService';
import { i18nService } from '../../../js/service/i18nService';
import { util } from '../../../js/util/util';
import { fontUtil } from '../../../js/util/fontUtil';

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
            imageData: this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null,
            fontUtil: fontUtil
        }
    },
    computed: {
        label() {
            let label = stateService.getDisplayText(this.gridElement.id) || i18nService.getTranslation(this.gridElement.label);
            return  util.convertLowerUppercase(label, this.metadata.textConfig.convertMode);
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