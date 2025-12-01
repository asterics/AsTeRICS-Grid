<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">
                    <a v-if="showCloseButton" id="closeLink" :title="$t('close')" class="modal-close-link black" href="javascript:;" @click="handleClose">
                        <i class="fas fa-times"></i>
                    </a>

                    <div class="modal-header">
                        <i :class="iconClass" :style="iconStyle"></i>
                        <h1>{{header}}</h1>
                    </div>

                    <div class="modal-body">
                        <div class="message-text">{{message}}</div>
                        <ul v-if="items && items.length > 0" class="success-items">
                            <li v-for="item in items" :key="item">{{item}}</li>
                        </ul>
                    </div>

                    <div class="modal-footer" v-if="buttons && buttons.length > 0">
                        <button
                            v-for="(button, index) in buttons"
                            :key="index"
                            @click="handleButtonClick(button)"
                            :class="['modal-btn', button.primary ? 'btn-primary' : 'btn-secondary']"
                        >
                            {{button.label | translate}}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import { i18nService } from '../../js/service/i18nService';

    // Modal types
    const MODAL_TYPE_SUCCESS = 'success';
    const MODAL_TYPE_QUESTION = 'question';
    const MODAL_TYPE_WARNING = 'warning';
    const MODAL_TYPE_INFO = 'info';

    // Button presets
    const BUTTONS_OK = 'ok';
    const BUTTONS_YES_NO = 'yesno';
    const BUTTONS_OK_CANCEL = 'okcancel';

    export default {
        props: [],
        data: function () {
            return {
                header: '',
                message: '',
                items: [],
                autoCloseDuration: 2000,
                timeoutId: null,
                type: MODAL_TYPE_SUCCESS,
                buttons: [],
                showCloseButton: false,
                resolve: null,
                reject: null
            }
        },
        computed: {
            iconClass() {
                const icons = {
                    [MODAL_TYPE_SUCCESS]: 'fas fa-check-circle',
                    [MODAL_TYPE_QUESTION]: 'fas fa-question-circle',
                    [MODAL_TYPE_WARNING]: 'fas fa-exclamation-triangle',
                    [MODAL_TYPE_INFO]: 'fas fa-info-circle'
                };
                return icons[this.type] || icons[MODAL_TYPE_SUCCESS];
            },
            iconStyle() {
                const styles = {
                    [MODAL_TYPE_SUCCESS]: 'color: green; font-size: 3em; margin-bottom: 0.5em;',
                    [MODAL_TYPE_QUESTION]: 'color: #007bff; font-size: 3em; margin-bottom: 0.5em;',
                    [MODAL_TYPE_WARNING]: 'color: #ff9800; font-size: 3em; margin-bottom: 0.5em;',
                    [MODAL_TYPE_INFO]: 'color: #2196F3; font-size: 3em; margin-bottom: 0.5em;'
                };
                return styles[this.type] || styles[MODAL_TYPE_SUCCESS];
            }
        },
        methods: {
            show(options) {
                console.log('Modal show() called with options:', options);

                // Clear any existing timeout
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }

                // Set basic properties
                this.type = options.type || MODAL_TYPE_SUCCESS;
                this.header = options.header || this.getDefaultHeader();
                this.message = options.message || '';
                this.items = options.items || [];

                // Handle buttons
                this.buttons = this.processButtons(options);

                // Handle auto-close (only for success/info without custom buttons)
                this.autoCloseDuration = options.autoCloseDuration !== undefined ? options.autoCloseDuration :
                    (this.type === MODAL_TYPE_SUCCESS && this.buttons.length === 0 ? 2000 : 0);

                // Show close button by default (even for auto-closing modals, in case user wants to dismiss early)
                this.showCloseButton = options.showCloseButton !== undefined ? options.showCloseButton : true;

                console.log('Modal data set:', {
                    type: this.type,
                    header: this.header,
                    message: this.message,
                    items: this.items,
                    buttons: this.buttons,
                    autoCloseDuration: this.autoCloseDuration
                });

                // Return a promise for async usage (e.g., confirm dialogs)
                return new Promise((resolve, reject) => {
                    this.resolve = resolve;
                    this.reject = reject;

                    if (this.autoCloseDuration > 0) {
                        this.timeoutId = setTimeout(() => {
                            console.log('Modal auto-closing');
                            this.handleClose(true);
                        }, this.autoCloseDuration);
                    }
                });
            },
            processButtons(options) {
                // If custom buttons provided, use them
                if (options.buttons && Array.isArray(options.buttons)) {
                    return options.buttons;
                }

                // If buttonPreset provided, use preset
                if (options.buttonPreset) {
                    return this.getButtonPreset(options.buttonPreset);
                }

                // If type is question/warning, default to Yes/No
                if (this.type === MODAL_TYPE_QUESTION || this.type === MODAL_TYPE_WARNING) {
                    return this.getButtonPreset(BUTTONS_YES_NO);
                }

                // Otherwise, no buttons (auto-close for success/info)
                return [];
            },
            getButtonPreset(preset) {
                const presets = {
                    [BUTTONS_OK]: [
                        { label: i18nService.t('ok'), value: true, primary: true }
                    ],
                    [BUTTONS_YES_NO]: [
                        { label: i18nService.t('no'), value: false, primary: false },
                        { label: i18nService.t('yes'), value: true, primary: true }
                    ],
                    [BUTTONS_OK_CANCEL]: [
                        { label: i18nService.t('cancel'), value: false, primary: false },
                        { label: i18nService.t('ok'), value: true, primary: true }
                    ]
                };
                return presets[preset] || presets[BUTTONS_OK];
            },
            getDefaultHeader() {
                const headers = {
                    [MODAL_TYPE_SUCCESS]: i18nService.t('success'),
                    [MODAL_TYPE_QUESTION]: i18nService.t('question'),
                    [MODAL_TYPE_WARNING]: i18nService.t('warning'),
                    [MODAL_TYPE_INFO]: i18nService.t('information')
                };
                return headers[this.type] || headers[MODAL_TYPE_SUCCESS];
            },
            handleButtonClick(button) {
                // Call button's callback if provided
                if (button.callback) {
                    button.callback();
                }

                // Resolve promise with button value
                if (this.resolve) {
                    this.resolve(button.value);
                }

                // Close modal
                this.$emit('close');
                this.cleanup();
            },
            handleClose(autoClose = false) {
                // For auto-close on success, resolve with true
                // For manual close (X button), resolve with false/null
                if (this.resolve) {
                    this.resolve(autoClose);
                }

                this.$emit('close');
                this.cleanup();
            },
            cleanup() {
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                }
                this.resolve = null;
                this.reject = null;
            }
        },
        mounted() {
        },
        beforeDestroy() {
            this.cleanup();
        }
    }
</script>

<style scoped>
    .modal-container {
        position: relative;
    }

    .modal-header {
        text-align: center;
        padding-bottom: 1em;
    }

    .modal-body {
        text-align: center;
        padding: 0;
    }

    .message-text {
        font-size: 1.2em;
        margin-bottom: 0.5em;
    }

    .success-items {
        list-style: none;
        padding: 0;
        font-size: 1.1em;
        margin-top: 0.5em;
    }

    .success-items li {
        margin: 0.3em 0;
    }

    .modal-footer {
        display: flex;
        justify-content: center;
        gap: 1em;
        padding: 1.5em 0 0;
        flex-wrap: wrap;
    }

    .modal-btn {
        padding: 0.7em 2em;
        font-size: 1em;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 100px;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0056b3;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background-color: #545b62;
    }

    .modal-close-link {
        position: absolute;
        top: 1em;
        right: 1em;
        font-size: 1.5em;
        z-index: 1;
    }
</style>
