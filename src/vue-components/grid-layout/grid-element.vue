<template>
    <component :is="componentType || defaultComponentType" :style="`display: flex; grid-column-start:${x + 1}; grid-column-end:${x + 1 + width}; grid-row-start:${y + 1}; grid-row-end:${y + 1 + height};`">
        <slot></slot>
    </component>
</template>

<script>

export default {
    props: ["x", "y", "width", "height", "componentType"],
    data() {
        return {
            defaultComponentType: "div"
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
</style>