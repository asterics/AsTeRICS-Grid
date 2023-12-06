<template>
    <dialog ref="modal">
        <div class="modal-header"><slot name="header"></slot></div>
        <div class="modal-body"><slot></slot></div>
        <div class="modal-footer"><slot name="footer"></slot></div>
    </dialog>
</template>

<script>
export default {
    methods: {
        open() {
            this.$refs.modal.showModal();
        },
        close() {
            this.$refs.modal.close();
        }
    }
};
</script>

<style scoped></style>
