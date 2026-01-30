<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">
                    <a v-if="showCloseButton" id="closeLink" :title="$t('close')" class="modal-close-link black" href="javascript:;" @click="handleClose">
                        <i class="fas fa-times"></i>
                    </a>

                    <div class="modal-header">
                        <i :class="iconClass"></i>
                        <h1>{{header}}</h1>
                    </div>

                    <div class="modal-body">
                        <div class="message-text">{{message}}</div>
                        <ul v-if="items && items.length > 0" class="message-items">
                            <li v-for="item in items" :key="item">{{item}}</li>
                        </ul>
                    </div>

                    <div class="modal-footer" v-if="buttons && buttons.length > 0">
                        <button
                            v-for="(button, index) in buttons"
                            :key="index"
                            @click="handleButtonClick(button)"
                        >
                            <i v-if="button.icon" :class="button.icon"></i> <span>{{button.label | translate}}</span>
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
    import { constants } from '../../js/util/constants';

    // Import constants for easier reference
    const MODAL_TYPE_SUCCESS = constants.MODAL_TYPE_SUCCESS;
    const MODAL_TYPE_QUESTION = constants.MODAL_TYPE_QUESTION;
    const MODAL_TYPE_WARNING = constants.MODAL_TYPE_WARNING;
    const MODAL_TYPE_INFO = constants.MODAL_TYPE_INFO;
    const BUTTONS_OK = constants.BUTTONS_OK;
    const BUTTONS_YES_NO = constants.BUTTONS_YES_NO;
    const BUTTONS_OK_CANCEL = constants.BUTTONS_OK_CANCEL;

    export default {
        props: [],
        data: function () {
            return {
                header: '',
                message: '',
                items: [],
                autoCloseDuration: 0,
                timeoutId: null,
                type: MODAL_TYPE_SUCCESS,
                buttons: [],
                showCloseButton: false,
                resolve: null,
                reject: null,
                onCloseFn: null
            }
        },
        computed: {
            iconClass() {
                const icons = {
                    [MODAL_TYPE_SUCCESS]: 'fas fa-check-circle icon-success',
                    [MODAL_TYPE_QUESTION]: 'fas fa-question-circle icon-question',
                    [MODAL_TYPE_WARNING]: 'fas fa-exclamation-triangle icon-warning',
                    [MODAL_TYPE_INFO]: 'fas fa-info-circle icon-info'
                };
                return icons[this.type] || icons[MODAL_TYPE_SUCCESS];
            }
        },
        methods: {
            show(options) {
                // Clear any existing timeout
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }

                // Set basic properties
                this.type = options.type || MODAL_TYPE_SUCCESS;
                this.header = options.header ? i18nService.t(options.header) : this.getDefaultHeader();
                this.message = options.message || '';
                this.items = options.items || [];
                this.onCloseFn = options.onClose || null;

                // Handle buttons
                this.buttons = this.processButtons(options);

                // Handle auto-close
                this.autoCloseDuration = options.autoCloseDuration !== undefined ? options.autoCloseDuration : 0;

                // Show close button by default
                this.showCloseButton = options.showCloseButton !== undefined ? options.showCloseButton : true;

                // Return a promise for async usage (e.g., confirm dialogs)
                return new Promise((resolve, reject) => {
                    this.resolve = resolve;
                    this.reject = reject;

                    if (this.autoCloseDuration > 0) {
                        this.timeoutId = setTimeout(() => {
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

                // Otherwise, no buttons
                return [];
            },
            getButtonPreset(preset) {
                const presets = {
                    [BUTTONS_OK]: [
                        { label: 'ok', value: true, icon: 'fas fa-check' }
                    ],
                    [BUTTONS_YES_NO]: [
                        { label: 'no', value: false, icon: 'fas fa-times' },
                        { label: 'yes', value: true, icon: 'fas fa-check' }
                    ],
                    [BUTTONS_OK_CANCEL]: [
                        { label: 'cancel', value: false, icon: 'fas fa-times' },
                        { label: 'ok', value: true, icon: 'fas fa-check' }
                    ]
                };
                return presets[preset] || presets[BUTTONS_OK];
            },
            getDefaultHeader() {
                return i18nService.t(this.type);
            },
            handleButtonClick(button) {
                // Resolve promise with button value
                if (this.resolve) {
                    this.resolve(button.value);
                }

                // Call onClose callback if provided
                if (this.onCloseFn) {
                    this.onCloseFn();
                }

                // Close modal
                this.$emit('close');
                this.cleanup();
            },
            handleClose(autoClose = false) {
                // For auto-close or manual close
                if (this.resolve) {
                    this.resolve(autoClose);
                }

                // Call onClose callback if provided
                if (this.onCloseFn) {
                    this.onCloseFn();
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
                this.onCloseFn = null;
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

    .modal-header i {
        font-size: 3em;
        margin-bottom: 0.5em;
    }

    .icon-success {
        color: green;
    }

    .icon-question {
        color: #007bff;
    }

    .icon-warning {
        color: #ff9800;
    }

    .icon-info {
        color: #2196F3;
    }

    .modal-body {
        text-align: center;
        padding: 0;
    }

    .message-text {
        font-size: 1.2em;
        margin-bottom: 0.5em;
    }

    .message-items {
        list-style: none;
        padding: 0;
        font-size: 1.1em;
        margin-top: 0.5em;
    }

    .message-items li {
        margin: 0.3em 0;
    }

    .modal-footer {
        display: flex;
        justify-content: center;
        gap: 1em;
        padding: 1.5em 0 0;
        flex-wrap: wrap;
    }

    .modal-close-link {
        position: absolute;
        top: 1em;
        right: 1em;
        font-size: 1.5em;
        z-index: 1;
    }
</style>
