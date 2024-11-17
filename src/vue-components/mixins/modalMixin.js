import Modal from '../modals/modal.vue';

export const modalMixin = {
    components: {Modal},
    methods: {
        openModal() {
            // Test if component using the mixin has the vue component Modal.vue as root element.
            if (this.$children.length > 0 && this.$children[0].$el.tagName === 'DIALOG') {
                const modal = this.$children[0];
                modal.open();
            }
        },
        closeModal() {
            // Test if component using the mixin has the vue component Modal.vue as root element.
            if (this.$children.length > 0 && this.$children[0].$el.tagName === 'DIALOG') {
                const modal = this.$children[0];
                modal.close();
            }
        }
    }
};
