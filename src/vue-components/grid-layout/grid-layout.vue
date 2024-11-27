<template>
    <component :is="useOptions.componentType" class="grid-layout" :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); background-color: ${useOptions.backgroundColor}`">
        <slot></slot>
    </component>
</template>

<script>

export default {
    props: ["rows", "columns", "options"],
    data() {
        return {
            defaultOptions: {
                backgroundColor: 'white',
                componentType: 'div'
            }
        }
    },
    computed: {
        useOptions() {
            return Object.assign(this.defaultOptions, this.options);
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
}
</style>