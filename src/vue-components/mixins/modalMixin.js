import BaseModal from '../modals/baseModal.vue';

export const modalMixin = {
    components: { BaseModal },
    methods: {
        openModal() {
            // Test if component using this mixin has the vue component Modal.vue as root element.
            if (this.$children.length > 0 && this.$children[0].$el.tagName === 'DIALOG') {
                const modal = this.$children[0];
                modal.open();
            }
        },
        closeModal() {
            // Test if component using this mixin has the vue component Modal.vue as root element.
            if (this.$children.length > 0 && this.$children[0].$el.tagName === 'DIALOG') {
                const modal = this.$children[0];
                modal.close();
            }
        }
    }
};
