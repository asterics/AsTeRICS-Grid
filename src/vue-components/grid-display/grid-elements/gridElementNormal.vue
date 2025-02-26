<template>
    <div class="grid-item-content">
        <div class="img-container" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
            <img :src="imageData" draggable="false" style="box-sizing: border-box; max-width: 100%; max-height: 100%; object-fit: contain; padding: 2%;" crossorigin="anonymous"/>
        </div>
        <grid-element-text-container v-show="label" :label="label" :with-image="!!imageData" :metadata="metadata" :grid-element="gridElement" v-bind="$attrs"/>
    </div>
</template>

<script>
import { stateService } from '../../../js/service/stateService';
import { i18nService } from '../../../js/service/i18nService';
import { util } from '../../../js/util/util';
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';

export default {
    components: { GridElementTextContainer },
    props: ["gridElement", "metadata"],
    data() {
        return {
            TextConfig: TextConfig
        }
    },
    computed: {
        label() {
            let label = stateService.getDisplayText(this.gridElement.id) || i18nService.getTranslation(this.gridElement.label);
            return  util.convertLowerUppercase(label, this.metadata.textConfig.convertMode);
        },
        imageData() {
            return this.gridElement.image ? this.gridElement.image.data || this.gridElement.image.url : null;
        }
    },
    methods: {
    },
    mounted() {
    }
}
</script>

<style scoped>
</style>