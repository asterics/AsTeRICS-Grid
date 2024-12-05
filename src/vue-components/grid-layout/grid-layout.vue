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
        }
    },
    methods: {
    },
    mounted() {
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