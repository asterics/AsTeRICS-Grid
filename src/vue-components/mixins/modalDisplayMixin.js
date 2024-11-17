export const modalDisplayMixin = {
    data() {
        return {
            currentModal: null
        };
    },
    methods: {
        handleModalClose() {
            this.currentModal = null;
        },
        setModal(modal) {
            this.currentModal = modal;
        }
    }
};
