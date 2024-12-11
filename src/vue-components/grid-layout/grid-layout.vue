<template>
    <div style="width: 100%; height: 100%; position: relative;">
        <div class="grid-bg-lines" v-if="backgroundLines">
            <div id="grid-layout-background-vertical" class="grid-container" :style="`margin-left: ${getRasterX()}px; background-size: ${getRasterX()}px ${getRasterX()}px; background-image: linear-gradient(to right, grey 1px, transparent 1px)`"/>
            <div class="grid-bg-lines" :style="`margin-top: ${getRasterY()}px; background-size: ${getRasterY()}px ${getRasterY()}px; background-image: linear-gradient(to bottom, grey 1px, transparent 1px);`"/>
        </div>
        <component ref="gridComponent" :is="componentType" class="grid-layout" :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); background-color: ${backgroundColor}`">
            <slot></slot>
        </component>
    </div>
</template>

<script>

export default {
    props: {
        rows: Number,
        columns: Number,
        backgroundColor: {
            type: String,
            default: 'white'
        },
        componentType: {
            type: String,
            default: 'div'
        },
        editable: {
            type: Boolean,
            default: false
        },
        elementClassSelector: {
            type: String,
            default: '.grid-layout-element'
        },
        resizeHandleSelector: {
            type: String,
            default: '.ui-resizable-handle'
        },
        backgroundLines: {
            type: Boolean,
            default: false
        },
        watchData: Object // on changes of this object interact.js is reloaded
    },
    data() {
        return {
            interact: null,
            timeoutHandler: null
        }
    },
    watch: {
        watchData() {
            this.initInteract();
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
            let style = getComputedStyle(this.$refs.gridComponent).getPropertyValue(property);
            let first = style.split(" ")[0];
            return parseFloat(first);
        },
        async initInteract() {
            if (!this.editable) {
                return;
            }
            let thiz = this;
            this.destroyInteract();
            this.interact = this.interact || (await import('interactjs')).default;

            let position = { x: 0, y: 0 };
            let oldZIndex = 0;
            this.interact(this.elementClassSelector).draggable({
                listeners: {
                    move (event) {
                        position.x += event.dx
                        position.y += event.dy

                        event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                        oldZIndex = event.target.style.zIndex;
                        event.target.style.zIndex = 100;
                    },
                    end(event) {
                        let movedElement = event.target;
                        let diff = {
                            x: Math.round(position.x / thiz.getRasterX()),
                            y: Math.round(position.y / thiz.getRasterY())
                        }
                        thiz.$emit('moved', movedElement, diff);
                        event.target.style.transform = '';
                        event.target.style.zIndex = oldZIndex;
                    }
                }
            }).resizable({
                edges: { left: false, right: true, bottom: this.resizeHandleSelector, top: false },
                listeners: {
                    move(event) {
                        event.target.style.width = event.rect.width + 'px';
                        event.target.style.height = event.rect.height + 'px';
                        oldZIndex = event.target.style.zIndex;
                        event.target.style.zIndex = 100;
                    },
                    end(event) {
                        event.target.style.width = '';
                        event.target.style.height = '';
                        event.target.style.zIndex = oldZIndex;
                        let resizedElement = event.target;
                        thiz.$emit('resized', resizedElement, {
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
        }
    },
    created() {
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        this.destroyInteract();
        window.removeEventListener("resize", this.onResize);
    },
    async mounted() {
        this.initInteract();
        this.$forceUpdate();
    },
}
</script>

<style scoped>
.grid-layout {
    display: grid;
    height: 100%;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-rows: minmax(0, 1fr);
}

.grid-bg-lines {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    overflow-y: hidden;
}
</style>