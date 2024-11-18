<template>
    <dialog ref="modal">
        <div class="modal">
            <div class="modal-mask">
                <div class="modal-wrapper">
                    <div class="modal-container">
                        <div v-if="header" class="modal-header">
                            <slot name="header">
                                <h1 v-if="title">{{ title }}</h1>
                                <button
                                    v-if="helpFn"
                                    class="remove-btn-skeleton help"
                                    @click="helpFn"
                                    :aria-label="ariaLabelHelp"
                                >
                                    <i class="fas fa-question-circle fa-lg" aria-hidden="true"></i>
                                </button>
                                <button class="remove-btn-skeleton close" @click="close" :aria-label="ariaLabelEsc">
                                    <i class="fas fa-times fa-lg" aria-hidden="true"></i>
                                </button>
                            </slot>
                            <!-- TODO: insert label/esc, aria-hidden (https://getbootstrap.com/docs/4.0/components/modal/#modal-components) -->
                        </div>
                        <div class="modal-body"><slot></slot></div>
                        <div v-if="footer" class="modal-footer">
                            <slot name="footer">
                                <button
                                    @click="close"
                                    @keydown.esc="close"
                                    :aria-label="ariaLabelCancel"
                                    :title="titleCancel"
                                >
                                    <i class="fas fa-times" aria-hidden="true"></i>
                                    {{ $t('cancel') }}
                                </button>
                                <slot name="ok-button">
                                    <button
                                        @click="ok"
                                        @keydown.ctrl.enter="ok"
                                        :aria-label="ariaLabelOk"
                                        :title="titleOk"
                                    >
                                        <i class="fas fa-check" aria-hidden="true"></i>
                                        {{ $t('ok') }}
                                    </button>
                                </slot>
                                <slot name="footer-appendix"></slot>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </dialog>
</template>

<script>
export default {
    methods: {
        ok() {
            this.$emit('ok');
        },
        open() {
            this.$refs.modal.showModal();
        },
        close() {
            this.$refs.modal.close();
            this.$emit('close');
        }
    },
    props: {
        title: {
            type: String,
            default: ''
        },
        helpFn: {
            type: Function,
            default: null
        },
        header: {
            type: Boolean,
            default: true
        },
        footer: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {};
    },
    computed: {
        titleCancel() {
            return this.$t('cancel') + ' ' + this.$t('keyboardEsc');
        },
        titleOk() {
            return this.$t('ok') + ' ' + this.$t('keyboardCtrlEnter');
        },
        ariaLabelCancel() {
            return '';
        },
        ariaLabelOk() {
            return '';
        },
        ariaLabelEsc() {
            return '';
        },
        ariaLabelHelp() {
            return '';
        }
    }
};
</script>

<style lang="scss" scoped>
::backdrop {
    background-image: linear-gradient(135deg, #123148, #2d7bb4, #123148);
    background-color: #2d7bb4;
    opacity: 0.75;
}

button {
    cursor: pointer;
}

.modal-header {
    display: flex;
    h1 {
        font-weight: 600;
        font-size: 2.2rem;
        flex-grow: 6;
    }

    button {
        margin: auto 0.75rem;
    }
}

.modal-footer {
    display: flex;
    > * {
        flex-grow: 1;
        margin: 0.25rem 0.5rem;
        min-width: 100px;
    }
}

.modal-header,
.modal-footer {
    display: flex;
    justify-content: space-between;
}

.remove-btn-skeleton {
    -moz-appearance: unset;
    -webkit-appearance: unset;
    appearance: unset;
    background-color: unset;
    border: unset;
    box-shadow: unset;
    color: unset;
    display: unset;
    font-size: unset;
    font-weight: unset;
    line-height: unset;
    outline: unset;
    padding: unset;
    text-align: unset;
    transition: unset;
}
</style>
