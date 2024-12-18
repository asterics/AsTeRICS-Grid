<template>
    <div :style="cssProps" :class="'grid-parent ' + myId">
        <div v-if="backgroundLines">
            <div class="grid-bg-lines" :style="`margin-left: ${getRasterX()}px; margin-right: 1px; background-size: ${getRasterX()}px ${getRasterX()}px; background-image: linear-gradient(to right, grey 1px, transparent 1px)`"/>
            <div class="grid-bg-lines" :style="`margin-top: ${getRasterY()}px; margin-bottom: 1px; background-size: ${getRasterY()}px ${getRasterY()}px; background-image: linear-gradient(to bottom, grey 1px, transparent 1px);`"/>
        </div>
        <transition-group ref="gridComponent" :name="editable ? 'grid-transition' : ''" :tag="baseTag" class="grid-layout" :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); background-color: ${backgroundColor}`">
            <grid-element v-for="elem in elements" :key="elem.id" :data-id="elem.id" :x="elem.x" :y="elem.y" :width="elem.width" :height="elem.height" :tag="elementTag" :class="elem.id + '' === noMoveId ? 'nomove' : ''">
                <component :id="elem.id" :is="renderComponent" :element="elem" v-bind="$attrs"/>
            </grid-element>
        </transition-group>
    </div>
</template>

<script>

import GridElement from './grid-element.vue';
import { gridLayoutUtil } from '../utils/gridLayoutUtil';

export default {
    components: { GridElement },
    props: {
        rows: Number,
        columns: Number,
        elements: Array,
        renderComponent: {
            type: [Object, String],
            default: null
        },
        backgroundColor: {
            type: String,
            default: 'white'
        },
        baseTag: {
            type: String,
            default: 'ol'
        },
        elementTag: {
            type: String,
            default: 'li'
        },
        editable: {
            type: Boolean,
            default: false
        },
        resizeHandleSelector: {
            type: String,
            default: '.ui-resizable-handle'
        },
        backgroundLines: {
            type: Boolean,
            default: false
        },
        animationDurationMs: {
            type: Number,
            default: 200
        }
    },
    data() {
        return {
            interact: null,
            timeoutHandler: null,
            noMoveId: null,
            myId: "grid-parent-" + new Date().getTime(),
            elementClassSelector: '.grid-layout-element'
        }
    },
    watch: {
        editable() {
            this.reinit();
        },
        rows() {
            this.reinit();
        },
        columns() {
            this.reinit();
        }
    },
    computed: {
        cssProps() {
            return {
                '--animation-duration': this.animationDurationMs + "ms"
            }
        }
    },
    methods: {
        getRasterX() {
            return this.getSizeFromStyle("grid-template-columns");
        },
        getRasterY() {
            return this.getSizeFromStyle("grid-template-rows");
        },
        getSizeFromStyle(property) {
            // see https://stackoverflow.com/a/66186894/9219743
            if (!this.$refs.gridComponent) {
                return 0;
            }
            let style = getComputedStyle(this.$refs.gridComponent.$el).getPropertyValue(property);
            let first = style.split(" ")[0];
            return parseFloat(first);
        },
        handleMove(movedElement, diff) {
            if (diff.x === 0 && diff.y === 0) {
                return;
            }
            let id = movedElement.children[0].id;
            let element = this.getElement(id);
            let updatedElements = gridLayoutUtil.resolveCollisions(this.elements, element, {
                diff: diff,
                gridWidth: this.columns,
                gridHeight: this.rows,
                calcNewPos: true
            });
            this.$emit("changed", updatedElements);
            this.reinit();
        },
        handleResize(resizedElement, newSize) {
            let id = resizedElement.children[0].id;
            let element = this.getElement(id);
            if (!element || !newSize ||
                (newSize.width === resizedElement.width && newSize.height === resizedElement.height)) {
                return;
            }
            element.width = newSize.width;
            element.height = newSize.height;
            let updatedElements = gridLayoutUtil.resolveCollisions(this.elements, element, {
                gridWidth: this.columns,
                gridHeight: this.rows,
            });
            this.$emit('changed', updatedElements);
            this.reinit();
        },
        getElement(id) {
            return this.elements.find(el => el.id + '' === id + '');
        },
        reinit() {
            this.$nextTick(() => {
                this.initInteract();
                this.$forceUpdate();
            });
        },
        async initInteract() {
            this.destroyInteract();
            if (!this.editable) {
                return;
            }
            let thiz = this;
            this.interact = this.interact || (await import('interactjs')).default;

            let position = { x: 0, y: 0 };
            let oldZIndex = 0;
            this.interact(this.elementClassSelector).draggable({
                listeners: {
                    start(event) {
                        oldZIndex = event.target.style.zIndex;
                    },
                    move(event) {
                        position.x += event.dx;
                        position.y += event.dy;
                        event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                        event.target.style.zIndex = 100;
                    },
                    end(event) {
                        let movedElement = event.target;
                        let diffX = position.x / thiz.getRasterX();
                        let diffY = position.y / thiz.getRasterY();
                        let diffXRound = Math.round(diffX);
                        let exact = Math.abs(diffXRound - diffX) < 0.25;
                        let diff = {
                            x: diffXRound,
                            y: Math.round(diffY),
                            exact: exact,
                            xExact: diffX,
                            yExact: diffY
                        }
                        thiz.handleMove(movedElement, diff);
                        event.target.style.transform = '';
                        thiz.noMoveId = event.target.getAttribute("data-id");
                        setTimeout(() => {
                            event.target.style.zIndex = oldZIndex;
                            thiz.noMoveId = null;
                        }, thiz.animationDurationMs + 100);
                    }
                }
            }).resizable({
                edges: { left: false, right: true, bottom: this.resizeHandleSelector, top: false },
                listeners: {
                    start(event) {
                        oldZIndex = event.target.style.zIndex;
                    },
                    move(event) {
                        event.target.style.width = event.rect.width + 'px';
                        event.target.style.height = event.rect.height + 'px';
                        event.target.style.zIndex = 100;
                    },
                    end(event) {
                        event.target.style.width = '';
                        event.target.style.height = '';
                        event.target.style.zIndex = oldZIndex;
                        let resizedElement = event.target;
                        thiz.handleResize(resizedElement, {
                            width: Math.round(event.rect.width / thiz.getRasterX()),
                            height: Math.round(event.rect.height / thiz.getRasterY())
                        });
                    }
                },
                modifiers: [
                    // minimum size
                    this.interact.modifiers.restrictSize({
                        min: { width: this.getRasterX(), height: this.getRasterY() }
                    })
                ]
            });
        },
        destroyInteract() {
            if (this.interact) {
                this.interact(this.elementClassSelector).unset();
            }
        },
        onResize() {
            clearTimeout(this.timeoutHandler);
            this.timeoutHandler = setTimeout(() => {
                this.$forceUpdate();
            }, 50);
        },
        pointerEventListener(event) {
            let element = event.target;
            let wasWithinMyParent = false;
            while (element) {
                if (element.className.includes(this.myId)) {
                    wasWithinMyParent = true;
                    break;
                }
                element = element.parentElement;
            }
            if (wasWithinMyParent) {
                let gridPos = this.$refs.gridComponent.$el.getBoundingClientRect();
                let x = event.clientX - gridPos.x;
                let y = event.clientY - gridPos.y;
                this.$emit('interacted', Math.floor(x / this.getRasterX()), Math.floor(y / this.getRasterY()), event);
            }
        }
    },
    created() {
        window.addEventListener("resize", this.onResize);
        document.addEventListener('click', this.pointerEventListener);
        document.addEventListener('touchend', this.pointerEventListener);
        document.addEventListener('contextmenu', this.pointerEventListener);
    },
    beforeDestroy() {
        this.destroyInteract();
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener('click', this.pointerEventListener);
        document.removeEventListener('touchend', this.pointerEventListener);
        document.removeEventListener('contextmenu', this.pointerEventListener);
    },
    async mounted() {
        this.initInteract();
        this.$forceUpdate();
    },
}
</script>

<style scoped>
.grid-parent {
    width: 100%;
    height: 100%;
    position: relative;
}

.grid-layout {
    display: grid;
    height: 100%;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-rows: minmax(0, 1fr);
    margin: 0;
    padding: 0;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
    -webkit-touch-callout: none;
}

.grid-bg-lines {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    overflow-y: hidden;
}

.grid-transition-move:not(.nomove) {
    transition: transform var(--animation-duration);
}
</style>