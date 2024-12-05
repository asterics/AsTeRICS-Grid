<template>
    <component :is="options.componentType" class="grid-layout" :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); background-color: ${options.backgroundColor}`">
        <slot></slot>
    </component>
</template>

<script>

export default {
    props: {
        rows: Number,
        columns: Number,
        options: {
            type: Object,
            default: () => {
                return {
                    backgroundColor: 'white',
                    componentType: 'div'
                }
            }
        }
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