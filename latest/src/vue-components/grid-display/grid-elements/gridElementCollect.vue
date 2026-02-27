<template>
    <div class="grid-item-content">
        <div :class="`collect-outer-container text-container ${metadata.textConfig.fontFamily}`" style="position: absolute; display: flex; top: 5px; right: 5px; bottom: 5px; left: 5px;">
        </div>
    </div>
</template>

<script>

export default {
    props: ["metadata"],
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