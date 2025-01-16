<template>
    <div class="grid-item-content" ref="container" :style="`font-family: ${metadata.textConfig.fontFamily};`">
        <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <div :class="`text-container ${metadata.textConfig.fontFamily}`" v-if="label"
             :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 1 : 0};
                      text-align: center; font-size: ${fontSizePx}px; line-height: ${lineHeight}; color: ${metadata.textConfig.fontColor};
                      flex-grow: ${imageData ? '0' : '1'};`">
            <span :style="`max-height: ${maxTextContainerHeight}; text-overflow: ${textOverflow}; white-space: ${whiteSpaceWrap}; margin: 0 ${txtMargin}px;`">{{label}}</span>
        </div>
    </div>
</template>

<script>
import { stateService } from '../../../js/service/stateService';
import { i18nService } from '../../../js/service/i18nService';
import { util } from '../../../js/util/util';
import { TextConfig } from '../../../js/model/TextConfig';
import { fontUtil } from '../../../js/util/fontUtil';

let MOBILE_MAX_WIDTH = 480;
let TEXT_MARGIN = 5;

export default {
    props: ["gridElement", "metadata"],
    data() {
        return {
            imageData: this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null,
            fontSizePx: null,
            fontSizePct: null,
            lineHeight: null,
            maxLines: null,
            maxTextContainerHeight: null,
            TextConfig: TextConfig,
            resizeObserver: null,
            textOverflow: null,
            whiteSpaceWrap: null,
            txtMargin: TEXT_MARGIN
        }
    },
    watch: {
        metadata: {
            handler() {
                this.calcFontSize();
            },
            deep: true
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
            }, 100, "WINDOW_RESIZE_ELEM" + this.gridElement.id);
        },
        calcFontSize() {
            let size = this.$refs.container.getBoundingClientRect();
            this.lineHeight = this.imageData ? this.metadata.textConfig.lineHeight : this.metadata.textConfig.onlyTextLineHeight;
            this.fontSizePx = this.getFontSizePx(size);
            this.maxTextContainerHeight = this.imageData ? (this.fontSizePx * this.metadata.textConfig.lineHeight * this.metadata.textConfig.maxLines) + 'px' : '100%';
            this.maxLines = this.imageData ? this.metadata.textConfig.maxLines : 100;
            this.textOverflow = this.metadata.textConfig.fittingMode === TextConfig.TOO_LONG_ELLIPSIS ? 'ellipsis' : 'clip';
            this.whiteSpaceWrap = this.maxLines === 1 ? 'nowrap' : 'normal';
        },
        getFontSizePx(size) {
            let pct = this.imageData ? this.metadata.textConfig.fontSizePct : this.metadata.textConfig.onlyTextFontSizePct;
            let fontSize = (size.height * (pct / 100) + size.width * (pct / 100)) / 2;
            let realWidth = fontUtil.getTextWidth(this.label, this.$refs.container, fontSize);
            let kbdContainerPct = 90;
            this.txtMargin = TEXT_MARGIN;
            if (document.documentElement.clientWidth < MOBILE_MAX_WIDTH) {
                this.txtMargin = 0;
                kbdContainerPct = 100;
            }
            if (this.metadata.textConfig.fittingMode === TextConfig.TOO_LONG_AUTO && realWidth > size.width - 2 * this.txtMargin) {
                fontSize = fontUtil.getFittingFontSize(this.label, this.$refs.container, { maxLines: this.maxLines, padding: this.txtMargin, maxSize: fontSize, lineHeight: this.lineHeight });
            }
            if (this.metadata.textConfig.autoSizeKeyboardLetters && !this.imageData &&
                (this.label.length === 1 || (this.label.length === 2 && /\p{Emoji}/u.test(this.label)))) { // keyboard letters
                fontSize = fontUtil.getFittingFontSize(this.label, this.$refs.container, { containerPct: kbdContainerPct, lineHeight: this.lineHeight, padding: this.txtMargin});
            }
            return fontSize;
        }
    },
    mounted() {
        this.calcFontSize();
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeListener();
            });
            this.resizeObserver.observe(this.$refs.container);
        } else {
            window.addEventListener("resize", this.resizeListener);
        }
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        } else {
            window.removeEventListener("resize", this.resizeListener);
        }
    }
}
</script>

<style scoped>
</style>