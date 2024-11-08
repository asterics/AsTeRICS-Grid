<template>
    <div :style="`display: grid; grid-template-columns: repeat(${columns}, 1fr); grid-template-rows: repeat(${rows}, 1fr); height: 100%`">
        <slot></slot>
    </div>
</template>

<script>

export default {
    props: ["rows", "columns"],
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
</style>