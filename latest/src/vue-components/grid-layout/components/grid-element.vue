<template>
    <component :is="tag || defaultTag" class="grid-layout-element" :style="`display: flex; grid-column-start:${x + 1}; grid-column-end:${x + 1 + width}; grid-row-start:${y + 1}; grid-row-end:${y + 1 + height};`">
        <slot></slot>
    </component>
</template>

<script>

export default {
    props: ["x", "y", "width", "height", "tag"],
    data() {
        return {
            defaultTag: "div"
        }
    },
    computed: {
    },
    methods: {
    },
    mounted() {
    },
}
</script>

<style scoped>
.grid-layout-element * {
    /* see https://stackoverflow.com/a/47378072/9219743 */
    -ms-touch-action: none;
    touch-action: none;
}
</style>