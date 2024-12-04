<template>
    <dialog ref="modal" @keydown.esc="close" :aria-labelledby="ariaLabelledById" :aria-label="ariaLabelModal">
        <div class="modal">
            <div v-if="header" class="header">
                <slot name="header">
                    <div v-if="icon" class="icon">
                        <i :class="icon" aria-hidden="true"></i>
                    </div>
                    <h1 v-if="title" :id="ariaLabelledById">{{ title }}</h1>
                    <slot name="header-extra"></slot>
                    <button class="close" v-if="esc" @click="close" :aria-label="$t('close')">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                    <button class="help" v-if="help" @click="handleHelp" :aria-label="$t('help')">
                        <i class="fas fa-question-circle" aria-hidden="true"></i>
                    </button>
                </slot>
            </div>
            <hr />
            <div class="body"><slot></slot></div>
            <hr v-if="footer" />
            <div v-if="footer" class="footer">
                <slot name="footer">
                    <slot name="footer-extra"></slot>
                    <div class="control">
                        <button @click="close" :title="$t('keyboardEsc')" :aria-label="$t('cancel')">
                            <i class="fas fa-times" aria-hidden="true"></i>
                            <span>{{ $t('cancel') }}</span>
                        </button>
                        <slot name="ok">
                            <button class="btn-primary" @click="handleOk" :title="$t('keyboardCtrlEnter')" :aria-label="$t('ok')">
                                <i class="fas fa-check" aria-hidden="true"></i>
                                <span>{{ $t('ok') }}</span>
                            </button>
                        </slot>
                    </div>
                </slot>
            </div>
        </div>
    </dialog>
</template>

<script>
import { helpService } from '../../js/service/helpService.js';

export default {
    props: {
        title: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        },
        help: {
            type: Boolean,
            default: true
        },
        esc: {
            type: Boolean,
            default: true
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
        return {
            labelledById: `id-${Math.random().toString(36).slice(2, 11)}`
        };
    },
    computed: {
        ariaLabelledById() {
            return this.title ? this.labelledById : undefined;
        },
        ariaLabelModal() {
            return this.title || this.$t('dialog');
        }
    },
    methods: {
        handleOk() {
            this.$emit('ok');
        },
        handleHelp() {
            if (this.help) helpService.openHelp();
            this.$emit('help');
        },
        open() {
            this.$nextTick(() => {
                this.$refs.modal.showModal();
                this.$emit('open');
            });
        },
        close() {
            this.$refs.modal.close();
            this.$emit('close');
        }
    }
};
</script>

<style lang="scss" scoped>
::backdrop {
    /* background-image: linear-gradient(135deg, #123148, #2d7bb4, #123148); */
    background-image: linear-gradient(135deg, #111111, #222222, #111111);
    background-color: #2d7bb4;
    opacity: 0.75;
}

dialog {
    width: 100%;
    max-width: 940px;
    padding: 0;
    border: 0.3rem solid #123148;
    border-radius: 1rem;
    min-height: 35vh;

    .modal {
        padding: 0;
        margin: 0;
    }

    .header,
    .body,
    .footer {
        padding: 0 3rem;
        margin: 0;
    }

    .header,
    .body,
    .footer,
    .footer .control {
        display: flex;
        flex-flow: column nowrap;
    }

    .header,
    .footer {
        justify-content: space-between;
        align-items: center;

        button {
            i {
                font-size: 2rem;
                width: 2rem;
                vertical-align: middle;
            }

            i + span,
            span + i {
                margin-left: 0.5rem;
            }
        }
    }

    .header {
        flex-flow: row nowrap;
        background-color: #eeeeee;
        padding-top: 2rem;
        padding-bottom: 2rem;
        /* padding-right: 1rem; */

        .help {
            order: 1;
        }

        .close {
            order: 2;
        }

        .icon {
            font-size: 1.6rem;
            padding: 1rem;
            padding-bottom: 1.2rem;
            color: #777;
        }

        & + hr {
            margin-top: 0;
        }

        h1 {
            display: flex;
            align-items: center;
            flex-grow: 6;
        }

        button {
            cursor: pointer;
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
            /* outline: unset; */
            padding: unset;
            text-align: unset;
            transition: unset;
            /* margin: unset; */

            padding: 5px;
            margin: auto;
            margin-right: 0.2rem;

            &:focus {
                outline: 3px solid lightblue;
            }
        }

        i {
            display: flex;
            justify-content: center;
        }
    }

    .footer {
        padding-bottom: 1rem;
        justify-content: flex-end;

        .control {
            width: 100%;
            display: flex;
            justify-content: flex-end;
        }

        button {
            margin-top: 0.5rem;
            width: 100%;
            padding: 0 2rem;
            display: flex;
            justify-content: center;
            align-items: center;

            i,
            span {
                display: inline-flex;
            }
        }
    }

    hr {
        margin: 1rem 0 2rem;
    }

    label {
        font-weight: bold;
    }
}

@media screen and (min-width: 768px) {
    dialog {
        .header,
        .body,
        .footer {
            padding: 0 4rem;
        }

        .header {
            padding-top: 2rem;
            padding-bottom: 1.4rem;
        }

        .footer {
            padding-bottom: 2rem;
            flex-flow: row nowrap;

            button {
                width: unset;
                margin-left: 2rem;
                margin-top: unset;
            }

            .control {
                flex-flow: row nowrap;

                button:first-child {
                    margin-left: 0;
                }
            }
        }
    }
}
</style>

<style lang="scss">
/*
* The following styles are auto-applied to elements with
* transition="modal" when their visibility is toggled
* by Vue.js.
*
* You can easily play with the modal transition by editing
* these styles.
*/
.modal-enter {
    opacity: 0;
}

.modal-leave-active {
    opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
}

/* FIXME: Styles from refactoring modal.css
 * Integrate in components and remove this part
 */
/* File input custom style */
.file-input input[type="file"] {
    position:absolute;
    top: -1000px;
}

.black, .black:focus {
    color: black;
}

.blue {
    color: #2d7bb4;
}

dialog {
    h2 {
        font-size: 1.3em;
        margin: 0;
        padding: 0;
    }

    .srow {
        margin-top: 1em;
    }

     .warn {
        font-weight: bold;
        color: #c96a00;
    }

    .success {
        font-weight: bold;
        color: darkgreen;
    }
}
</style>