<template>
    <component ref="gridComponent" :is="componentType" class="grid-layout" :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); background-color: ${backgroundColor}`">
        <slot></slot>
    </component>
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
        elementClass: {
            type: String,
            default: 'grid-layout-element'
        },
        watchData: Object // on changes of this object interact.js is reloaded
    },
    data() {
        return {
            interact: null
        }
    },
    watch: {
        watchData() {
            this.initInteract();
        }
    },
    computed: {
        elementClassSelector() {
            return `.${this.elementClass}`;
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
            this.interact(this.elementClassSelector).draggable({
                listeners: {
                    move (event) {
                        position.x += event.dx
                        position.y += event.dy

                        event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
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
                        event.target.style.zIndex = '';
                    }
                }
            });
        },
        destroyInteract() {
            if (this.interact) {
                this.interact(this.elementClassSelector).unset();
            }
        }
    },
    beforeDestroy() {
        this.destroyInteract();
    },
    async mounted() {
        this.initInteract();
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
</style>