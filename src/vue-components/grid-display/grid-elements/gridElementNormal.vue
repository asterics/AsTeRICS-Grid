<template>
    <div class="grid-item-content" ref="container">
        <div class="img-container" v-if="imageData" :style="`order: ${textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <div class="text-container" v-if="label"
             :style="`order: ${textPosition === TextConfig.TEXT_POS_BELOW ? 1 : 0}
                      text-align: center; font-size: ${fontSizePx}px; line-height: ${lineHeight};
                      flex-grow: ${imageData ? '0' : '1'}; white-space: ${allowMultipleLines ? 'wrap' : 'nowrap'}`">
            <span>{{label}}</span>
        </div>
    </div>
</template>

<script>
import { stateService } from '../../../js/service/stateService';
import { i18nService } from '../../../js/service/i18nService';
import { util } from '../../../js/util/util';
import { fontUtil } from '../../../js/util/fontUtil';
import { TextConfig } from '../../../js/model/TextConfig';

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
            imageData: this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null,
            fontUtil: fontUtil,
            fontSizePx: 14,
            fontSizePct: null,
            lineHeight: 1.5,
            allowMultipleLines: false,
            textPosition: TextConfig.TEXT_POS_BELOW,
            TextConfig: TextConfig
        }
    },
    computed: {
        label() {
            let label = stateService.getDisplayText(this.gridElement.id) || i18nService.getTranslation(this.gridElement.label);
            return  util.convertLowerUppercase(label, this.metadata.textConfig.convertMode);
        }
    },
    methods: {
        resizeListener() {
            util.debounce(() => {
                this.calcFontSize();
                this.$forceUpdate();
            }, 200, "WINDOW_RESIZE_ELEM" + this.gridElement.id);
        },
        calcFontSize() {
            let size = this.$refs.container.getBoundingClientRect();
            this.fontSizePct = this.imageData ? 15 : 40;
            this.fontSizePx = size.height * this.fontSizePct / 100;
        }
    },
    mounted() {
        window.addEventListener("resize", this.resizeListener);
        this.calcFontSize();
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.resizeListener);
    }
}
</script>

<style scoped>
</style>