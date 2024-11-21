<template>
    <div class="grid-item-content">
        <div class="img-container" v-if="imageData" :style="`flex: 1 1 auto;`">
            <img :src="imageData" draggable="false" style="max-width: 98%; max-height: 98%; object-fit: contain; margin: 1%;" crossorigin="anonymous"/>
        </div>
        <div class="text-container" v-if="label" :style="`flex: 1 1 auto; text-align: center; font-size: 14px;`"><span>{{label}}</span></div>
    </div>
</template>

<script>
import { stateService } from '../../js/service/stateService';
import { i18nService } from '../../js/service/i18nService';
import { util } from '../../js/util/util';
import { fontUtil } from '../../js/util/fontUtil';

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
            imageData: this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null,
            label: '',
            fontUtil: fontUtil
        }
    },
    methods: {
    },
    mounted() {
        this.label = stateService.getDisplayText(this.gridElement.id) || i18nService.getTranslation(this.gridElement.label);
        this.label = util.convertLowerUppercase(this.label, this.metadata.textConfig.convertMode);
    },
}
</script>

<style scoped>
</style>