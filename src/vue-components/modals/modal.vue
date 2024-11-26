<template>
    <dialog
        ref="modal"
        aria-labelledby="modal-label"
        @keydown.esc="close"
        >
        <div v-if="header" class="modal-header">
            <slot name="header">
                <h1 id="modal-label" class="col-8 col-sm-10 col-md-10" v-if="title">{{ title }}</h1>
                <button
                    v-if="helpFn"
                    class="remove-btn-skeleton help"
                    @click="helpFn"
                    :aria-label="ariaLabelHelp"
                    >
                        <i class="fas fa-question-circle" aria-hidden="true"></i>
                </button>
                <button
                    class="remove-btn-skeleton close"
                    @click="close"
                    :aria-label="ariaLabelEsc"
                    >
                        <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </slot>
            <!-- TODO: insert label/esc, aria-hidden (https://getbootstrap.com/docs/4.0/components/modal/#modal-components) -->
        </div>
        <div class="modal-body"><slot></slot></div>
        <div v-if="footer" class="modal-footer">
            <slot name="footer">
                <button
                    @click="close"
                    :aria-label="ariaLabelCancel"
                    :title="keyboardCancel"
                    >
                        <i class="fas fa-times" aria-hidden="true"></i>
                        {{ ariaLabelCancel }}
                </button>
                <slot name="ok-button">
                    <button
                        @click="ok"
                        @keydown.ctrl.enter="ok"
                        :aria-label="ariaLabelOk"
                        :title="keyboardOk"
                        >
                            <i class="fas fa-check" aria-hidden="true"></i>
                            {{ ariaLabelOk }}
                    </button>
                </slot>
            </slot>
        </div>
    </dialog>
</template>

<script>
import { helpService } from "../../js/service/helpService";

export default {
    methods: {
        ok() {
            this.$emit('ok');
        },
        close() {
            this.$emit('close');
        },
        help() {
            helpService.openHelp();
            this.$emit('help');
        }
    },
    props: {
        title: {
            type: String,
            default: ''
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
    computed: {
        ariaLabelHelp() {
            return this.$t('help');
        },
        ariaLabelEsc() {
            return this.$t('close');
        },
        keyboardCancel() {
            return this.$t('keyboardEsc');
        },
        keyboardOk() {
            return this.$t('keyboardCtrlEnter');
        },
        ariaLabelCancel() {
            return this.$t('cancel');
        },
        ariaLabelOk() {
            return this.$t('ok');
        },
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
    border-bottom: 1px solid #123148;
    box-shadow: 0 0 2px 1px #123148;
    margin-bottom: 2rem;
    padding: 2rem 4rem;

    h1 {
        font-weight: 600;
        font-size: 2.2rem;
        flex-grow: 6;
        display: flex;
        align-items: center;
        /* margin-left: 1rem; */
    }

    button {
        padding: 5px;
        margin: 0 0.5rem 0.25rem;
        background-color: #2d7bb433;
        border: 1px solid #12314833;
        box-shadow: 0 0 0 1px #123148;

        &:focus {
            outline: 3px solid lightblue;
        }
    }

    i {
        font-size: 2rem;
        width: 2rem;
        text-align: center;
        display: inline-block
    }
}

.modal-body {
    display: flex;
    flex-flow: column nowrap;
    padding: 2rem 4rem;

    label {
        font-weight: bold;
    }
}

.modal-footer {
    display: flex;
    flex-flow: column nowrap;
    margin-bottom: 2rem;
    padding: 0 2rem 0;

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

dialog {
    width: 100%;
    max-width: 940px;
    min-height: 50vh;

    padding: 0;

    & * {
        font-size: 1.6rem;
    }
}

@media screen and (min-width: 768px) {
    .modal-footer {
        flex-flow: row nowrap;
    }
}
</style>
