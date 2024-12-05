import BaseModal from '../modals/baseModal.vue';

export const modalMixin = {
    components: { BaseModal },
    computed: {
        baseModal() {
            return this.$children[0] && this.$children[0].isBaseModal ? this.$children[0] : {}
        }
    },
    methods: {
        openModal() {
            this.baseModal.open();
        },
        closeModal() {
            this.baseModal.close();
        }
    },
    mounted() {
        this.baseModal.$on('close', () => {
            // reset component data, see https://stackoverflow.com/a/50854892/9219743
            Object.assign(this.$data, this.$options.data.apply(this));
        });
    }
};
