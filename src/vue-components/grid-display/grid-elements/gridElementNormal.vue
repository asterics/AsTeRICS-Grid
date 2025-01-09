<template>
    <div class="grid-item-content" ref="container">
        <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <div :class="`text-container ${metadata.textConfig.fontFamily}`" v-if="label"
             :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 1 : 0};
                      text-align: center; font-size: ${fontSizePx}px; line-height: ${lineHeight};
                      flex-grow: ${imageData ? '0' : '1'}; white-space: ${allowMultipleLines ? 'wrap' : 'nowrap'};
                      font-family: ${metadata.textConfig.fontFamily};`">
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
            lineHeight: null,
            allowMultipleLines: null,
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
            let pct = this.imageData ? this.metadata.textConfig.fontSizePct : this.metadata.textConfig.onlyTextFontSizePct;
            this.fontSizePx = size.height * pct / 100;
            this.allowMultipleLines = this.imageData ? this.metadata.textConfig.allowMultipleLines : true;
            this.lineHeight = this.imageData ? this.metadata.textConfig.lineHeight : this.metadata.textConfig.onlyTextLineHeight;
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