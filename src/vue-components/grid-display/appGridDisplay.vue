<template>
    <div ref="mainContainer" style="flex: 1 1 auto; max-width: 100%; min-height: 0">
        <grid-layout ref="gridLayout" v-if="gridData && oneElementSize" :key="gridData.id"
                     :elements="gridData.gridElements" :render-component="AppGridElement"
                     :background-color="metadata.colorConfig.gridBackgroundColor"
                     :rows="gridData.rowCount" :columns="gridData.minColumnCount"
                     :metadata="metadata" :one-element-size="oneElementSize" v-on="$listeners"
                     :show-resize-handle="editable" :editable="editable" :background-lines="editable"
        >
        </grid-layout>
    </div>
</template>

<script>

import GridLayout from '../grid-layout/components/grid-layout.vue';
import GridElement from '../grid-layout/components/grid-element.vue';
import AppGridElement from './appGridElement.vue';
import { gridUtil } from '../../js/util/gridUtil';
import { util } from '../../js/util/util';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata", "editable"],
    data() {
        return {
            AppGridElement: AppGridElement,
            oneElementSize: null,
            resizeObserver: null
        }
    },
    computed: {
    },
    methods: {
        recalculate() {
            let containerSize = this.$refs.mainContainer.getBoundingClientRect(); // don't use async util.getElementSize since it leads to problems in gridView initializing input methods too early
            let oneElementSize = gridUtil.getOneElementSize(containerSize, this.gridData);
            if (!this.oneElementSize || this.oneElementSize.width !== oneElementSize.width || this.oneElementSize.height !== oneElementSize.height) {
                this.oneElementSize = oneElementSize;
            }
        },
        resizeListener() {
            util.debounce(() => {
                this.recalculate();
            }, 100, "WINDOW_RESIZE" + this.gridData.id);
        },
    },
    mounted() {
        this.recalculate();
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeListener();
            });
            this.resizeObserver.observe(this.$refs.mainContainer);
        } else {
            this.recalculate();
            window.addEventListener('resize', this.resizeListener);
        }
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        } else {
            window.removeEventListener('resize', this.resizeListener);
        }
    }
}
</script>

<style scoped>
</style>