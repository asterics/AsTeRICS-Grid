<template>
    <div class="child-placeholder">
        <span>{{ $t('childGrid') }}</span>
    </div>
</template>

<script>

export default {
}
</script>

<style scoped>
.child-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2em;
    width: 100%;
    height: 100%;
    background-color: rgba(245, 245, 245, 0.75);
    background-image: repeating-linear-gradient(
        45deg,
        rgba(0, 0, 0, 0.10),
        rgba(0, 0, 0, 0.10) 10px,
        transparent 10px,
        transparent 20px
    );
}
</style>