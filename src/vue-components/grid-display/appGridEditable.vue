<template>
    <grid-layout class="grid-display" v-if="gridData" @moved="moveHandler" @resized="resizeHandler"
                 :elements="gridData.gridElements"
                 :render-component="AppGridElement" :metadata="metadata" :show-resize-handle="true"
                 :enable-animation="true" :editable="true" :rows="gridData.rowCount" :columns="gridData.minColumnCount"
                 :background-color="metadata.colorConfig.gridBackgroundColor" :background-lines="true"
                 component-type="ol" :watch-data="gridData">
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import GridElement from '../grid-layout/grid-element.vue';
import AppGridElement from './appGridElement.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata"],
    data() {
        return {
            AppGridElement: AppGridElement
        }
    },
    computed: {
    },
    methods: {
        moveHandler(movedElement, diff) {
            if (diff.x === 0 && diff.y === 0) {
                return;
            }
            let id = movedElement.children[0].id;
            let element = this.getElement(id);
            if (element.x + diff.x >= 0 && element.y + diff.y >= 0) {
                element.x += diff.x;
                element.y += diff.y;
            }
            gridUtil.resolveCollisions(this.gridData, element, diff);
            this.$emit("changed", this.gridData);
        },
        resizeHandler(resizedElement, newSize) {
            let id = resizedElement.children[0].id;
            let element = this.getElement(id);
            if (!element || !newSize ||
                (newSize.width === resizedElement.width && newSize.height === resizedElement.height)) {
                return;
            }
            element.width = newSize.width;
            element.height = newSize.height;
            gridUtil.resolveCollisions(this.gridData, element);
            this.$emit('changed', this.gridData);
        },
        getElement(id) {
            return this.gridData.gridElements.find(el => el.id === id);
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
.grid-display {
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
    -webkit-touch-callout: none;
}
</style>