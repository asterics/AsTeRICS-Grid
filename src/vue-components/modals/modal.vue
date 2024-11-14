<template>
    <dialog ref="modal">
        <div class="modal-header">
            <slot name="header">
                <h1 v-if="title">{{ title }}</h1>
                <button v-if="helpFn" class="remove-btn-skeleton help" @click="helpFn" :aria-label="ariaLabelHelp">
                    <i class="fas fa-question-circle fa-lg" aria-hidden="true"></i>
                </button>
                <button class="remove-btn-skeleton close" @click="close" :aria-label="ariaLabelEsc">
                    <i class="fas fa-times fa-lg" aria-hidden="true"></i>
                </button>
            </slot>
            <!-- TODO: insert label/esc, aria-hidden (https://getbootstrap.com/docs/4.0/components/modal/#modal-components) -->
        </div>
        <div class="modal-body"><slot></slot></div>
        <div class="modal-footer">
            <slot name="footer">
                <button @click="close" @keydown.esc="close" :aria-label="ariaLabelCancel" :title="titleCancel">
                    <i class="fas fa-times" aria-hidden="true"></i>
                    {{ $t('cancel') }}
                </button>
                <slot name="ok-button">
                    <button @click="open" @keydown.ctrl.enter="open" :aria-label="ariaLabelOk" :title="titleOk">
                        <i class="fas fa-check" aria-hidden="true"></i>
                        {{ $t('ok') }}
                    </button>
                </slot>
                <slot name="footer-appendix"></slot>
            </slot>
        </div>
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
    },
    props: {
        title: {
            type: String,
            default: ''
        },
        helpFn: {
            type: Function,
            default: null
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

dialog {
    max-width: 920px;
    margin: auto;
    padding: 2rem 4rem;

    .modal-header,
    .modal-body,
    .modal-footer {
        display: flex;
    }

    .modal-header,
    .modal-footer {
        flex-flow: row nowrap;
        align-items: center;
    }

    .modal-body {
        flex-flow: row wrap;
    }

    .modal-header {
        h1 {
            font-weight: 600;
            font-size: 2.2rem;
            flex-grow: 6;
        }
    }

    .modal-footer {
        > * {
            flex-grow: 1;
            margin: 0.25rem 0.5rem;
            min-width: 100px;
        }
    }

    .modal-header,
    .modal-footer {
        justify-content: space-between;
    }
}

@media screen and (max-width: 768px) {
    /* Rules for Smartphones */
}

@media screen and (max-width: 1024px) {
    /* Rules for Tablets */
    dialog {
        .modal-footer {
            flex-flow: row wrap;
        }
    }
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

/* .modal-header,
.modal-body,
.modal-footer {
    /* display: flex; */
/* flex-flow: row nowrap;
    align-content: space-between;
} */

/* .modal-header .close {
    appearance: none;
}

.modal-header .close {
    display: unset;
    padding: unset;
    line-height: unset;
    font-size: unset;
    font-weight: unset;
    text-align: unset;
    border: unset;
    outline: unset;
    border-radius: unset;
    box-shadow: unset;
    background-color: unset;
    color: unset;
    transition: unset;
} */
</style>
