<template>
    <div class="grid-layout" :style="`grid-template-columns: repeat(${columns}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`">
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
.grid-layout {
    display: grid;
    height: 100%;
}
</style>