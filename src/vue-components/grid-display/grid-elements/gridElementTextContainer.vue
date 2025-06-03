<template>
    <div ref="txtContainer" :class="`text-container ${metadata.textConfig.fontFamily}`"
         :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 1 : 0};
                  text-align: center; font-size: ${fontSizePx}px; line-height: ${lineHeight}; color: ${gridElement && gridElement.fontColor ? gridElement.fontColor : 'unset'};
                  flex-grow: ${withImage ? '0' : '1'};`">
        <span :style="`max-height: ${maxTextContainerHeight}; text-overflow: ${textOverflow}; white-space: ${whiteSpaceWrap}; margin: 0 ${txtMargin}px;`">
            <span v-html="displayLabel"/>
        </span>
    </div>
</template>

<script>
import { TextConfig } from '../../../js/model/TextConfig';
import { fontUtil } from '../../../js/util/fontUtil';
import $ from '../../../js/externals/jquery';
import { constants } from '../../../js/util/constants';
import { util } from '../../../js/util/util';
import { stateService } from '../../../js/service/stateService';
import { i18nService } from '../../../js/service/i18nService';

let MOBILE_MAX_WIDTH = 480;
let TEXT_MARGIN = 5;

export default {
    props: ["withImage", "metadata", "gridElement", "containerSize", "disableAutoSizeKeyboard", "watchForChanges", "editable"],
    data() {
        return {
            ready: false,
            fontSizePx: 0,
            lineHeight: null,
            maxLines: null,
            maxTextContainerHeight: null,
            TextConfig: TextConfig,
            textOverflow: null,
            whiteSpaceWrap: null,
            txtMargin: TEXT_MARGIN,
            externalSetLabel: ''
        }
    },
    watch: {
        containerSize() {
            this.calcFontSize();
        }
    },
    computed: {
        calculateLabel() {
            let label = '';
            if(this.gridElement) {
                label = stateService.getDisplayText(this.gridElement.id) || i18nService.getTranslation(this.gridElement.label);
            }
            label = ((this.externalSetLabel + '') || label || '') + '';
            return util.convertLowerUppercase(label, this.metadata.textConfig.convertMode);
        },
        displayLabel() {
            let label = util.replaceAll(this.calculateLabel, '\n', '<br>');
            label = util.replaceAll(label, '\\\\n', '<br>');
            return util.replaceAll(label, '\\\\N', '<br>');
        },
    },
    methods: {
        calcFontSize() {
            if (!this.$refs.txtContainer || !this.$refs.txtContainer.parentElement) {
                return;
            }
            let size = this.containerSize;
            this.lineHeight = this.withImage ? this.metadata.textConfig.lineHeight : this.metadata.textConfig.onlyTextLineHeight;
            this.maxLines = this.withImage ? this.metadata.textConfig.maxLines : 100;
            this.fontSizePx = this.getFontSizePx(size);
            this.maxTextContainerHeight = this.withImage ? (this.fontSizePx * this.lineHeight * this.metadata.textConfig.maxLines) + 'px' : '100%';
            this.textOverflow = this.metadata.textConfig.fittingMode === TextConfig.TOO_LONG_ELLIPSIS ? 'ellipsis' : 'clip';
            this.whiteSpaceWrap = this.maxLines === 1 ? 'nowrap' : 'normal';
            this.ready = true;
        },
        getFontSizePx(size) {
            let label = this.calculateLabel;
            let fontSize = this.getBaseFontSize(size);
            let realWidth = fontUtil.getTextWidth(label, this.$refs.txtContainer.parentElement, fontSize);
            let kbdContainerPct = 80;
            this.txtMargin = TEXT_MARGIN;
            if (document.documentElement.clientWidth < MOBILE_MAX_WIDTH) {
                this.txtMargin = 0;
                kbdContainerPct = 100;
            }
            if (this.metadata.textConfig.fittingMode === TextConfig.TOO_LONG_AUTO && realWidth > size.width - 2 * this.txtMargin) {
                let newFontSize = fontUtil.getFittingFontSize(label, this.$refs.txtContainer.parentElement, {
                    maxLines: this.maxLines,
                    padding: this.txtMargin,
                    maxSize: fontSize,
                    lineHeight: this.lineHeight,
                    containerSize: size
                });
                if (this.withImage && this.maxLines === 1) {
                    let factor = newFontSize / fontSize;
                    this.lineHeight /= factor;
                }
                fontSize = newFontSize;
            }
            if (!this.disableAutoSizeKeyboard && this.metadata.textConfig.autoSizeKeyboardLetters && !this.withImage &&
                (label.length === 1 || (label.length === 2 && new RegExp(constants.EMOJI_REGEX, "").test(label)))) { // keyboard letters
                fontSize = fontUtil.getFittingFontSize(label, this.$refs.txtContainer.parentElement, {
                    containerPct: kbdContainerPct,
                    lineHeight: this.lineHeight,
                    padding: this.txtMargin,
                    containerSize: size
                });
            }
            return fontSize;
        },
        getBaseFontSize(containerSize) {
            let pct = this.getBaseFontSizePct();
            return fontUtil.pctToPx(pct, containerSize);
        },
        getBaseFontSizePct() {
            let pct = this.withImage ? this.metadata.textConfig.fontSizePct : this.metadata.textConfig.onlyTextFontSizePct;
            if (this.gridElement) {
                pct = Number.isInteger(this.gridElement.fontSizePct) ? this.gridElement.fontSizePct : pct;
            }
            return pct;
        },
        externalUpdateFn(event, id, text) {
            if (this.gridElement && id === this.gridElement.id) {
                this.externalSetLabel = text;
                this.calcFontSize();
            }
        }
    },
    mounted() {
        this.calcFontSize();
        $(document).on(constants.EVENT_ELEM_TEXT_CHANGED, this.externalUpdateFn);
        if (this.editable || this.watchForChanges) {
            this.$watch("metadata", () => {
                this.calcFontSize();
            }, { deep: true });
            this.$watch("gridElement", () => {
                this.calcFontSize();
            }, { deep: true });
        }
    },
    beforeDestroy() {
        $(document).off(constants.EVENT_ELEM_TEXT_CHANGED, this.externalUpdateFn);
    }
}
</script>

<style scoped>
</style>