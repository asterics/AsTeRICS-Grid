<template>
    <div ref="container" class="grid-item-content">
        <div class="img-container" v-if="pictoUrl && showPictos" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="pictoUrl" draggable="false" alt=""/>
        </div>
        <grid-element-text-container :with-image="!!(pictoUrl && showPictos)" :metadata="metadata" :grid-element="gridElement" :container-size="containerSize" :disable-auto-size-keyboard="true" v-bind="$attrs"/>
    </div>
</template>

<script>

import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';

export default {
    components: { GridElementTextContainer },
    props: ["metadata", "gridElement", "containerSize"],
    data() {
        return {
            TextConfig: TextConfig,
            pictoUrl: null,
            lastWord: null,
            debounceTimer: null,
            showPictos: true
        }
    },
    methods: {
        async updatePicto(word) {
            if (!word || !word.trim()) {
                this.pictoUrl = null;
                return;
            }
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                try {
                    const { pictogramPredictionService } = await import('../../../js/service/pictograms/pictogramPredictionService.js');
                    const { dataService } = await import('../../../js/service/data/dataService.js');
                    const metadata = await dataService.getMetadata();
                    this.showPictos = !!(metadata && metadata.showPictogramsInPredictions);
                    if (!this.showPictos) { this.pictoUrl = null; return; }
                    const lang = metadata && metadata.pictogramPredictionLang ? metadata.pictogramPredictionLang : null;
                    const provider = metadata && metadata.pictogramPredictionProvider ? metadata.pictogramPredictionProvider : 'GLOBALSYMBOLS';
                    const picto = await pictogramPredictionService.getPictoForWord(word, lang, provider);
                    this.pictoUrl = (picto && picto.url) ? picto.url : null;
                } catch (e) {
                    this.pictoUrl = null;
                }
            }, 250);
        },
        onTextChanged(event, id, text) {
            if (!this.gridElement || id !== this.gridElement.id) return;
            const word = (text || '').trim();
            if (word === this.lastWord) return;
            this.lastWord = word;
            this.updatePicto(word);
        }
    },
    mounted() {
        // Event-driven: listen to text change events for this prediction element
        // to minimize DOM observation overhead.
        const addListener = async () => {
            const { constants } = await import('../../../js/util/constants.js');
            const $ = (await import('../../../js/externals/jquery.js')).default;
            this._$ = $;
            this._eventName = constants.EVENT_ELEM_TEXT_CHANGED;
            $(document).on(this._eventName, this.onTextChanged);
        };
        addListener();
    },
    beforeDestroy() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        if (this._$ && this._eventName) {
            this._$(document).off(this._eventName, this.onTextChanged);
        }
    }
}
</script>

<style scoped>
</style>