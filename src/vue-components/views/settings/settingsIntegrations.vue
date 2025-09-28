<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">ARASAAC</h3>
                <div>
                    <input id="activateARASAACGrammarAPI" type="checkbox" v-model="metadata.activateARASAACGrammarAPI" @change="saveMetadata(metadata)"/>
                    <label for="activateARASAACGrammarAPI">
                        <i18n path="activateAutomaticGrammarCorrectionARASAACAPI" tag="span">
                            <template v-slot:availableLangs>
                                <span>{{util.arrayToPrintable(arasaacService.getSupportedGrammarLangs(true))}}</span>
                            </template>
                        </i18n>
                    </label>
                </div>
                <div class="mt-3">
                    <span class="fa fa-info-circle"></span>
                    <span></span>
                    <i18n path="noteThatActivatingThisSendsSentencesToARASAACSeePrivacy" tag="span">
                        <template v-slot:link>
                            <a v-if="!i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_en.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a><a v-if="i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_de.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a>
                        </template>
                    </i18n>
                </div>
            </div>
        </div>
        <h3>{{ $t('externalSpeechService') }}</h3>
        <div class="srow">
            <label class="three columns" for="externalSpeechUrl">{{ $t('externalSpeechUrl') }}</label>
            <input type="text" id="externalSpeechUrl" class="seven columns" v-model="appSettings.externalSpeechServiceUrl" @input="onSpeechUrlInput" placeholder="http://localhost:5555"/>
            <span class="spaced" v-show="urlValid === undefined"><i class="fas fa-spinner fa-spin"/></span>
            <span class="spaced" v-show="urlValid" style="color: green" :title="$t('urlIsValid')"><i class="fas fa-check"/></span>
            <span class="spaced" v-show="urlValid === false" style="color: red" :title="$t('urlIsInvalid')"><i class="fas fa-times"/></span>
        </div>
        <div class="mt-3">
            <span class="fa fa-info-circle"></span>
            <span></span>
            <i18n path="findDetailsAt" tag="span">
                <template v-slot:link>
                    <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid-Helper?tab=readme-ov-file#speech">{{ $t('infoAboutExternalSpeechService') }}</a>
                </template>
            </i18n>
        </div>

        <h3>{{ $t('CTRANSFER_HEADING') }}</h3>
        <p class="info-text">{{ $t('CTRANSFER_SETTINGS_HINT') }}</p>
        <div class="srow">
            <label class="three columns" for="collectTransferRelay">{{ $t('CTRANSFER_RELAY_URL_LABEL') }}</label>
            <input type="text" id="collectTransferRelay" class="seven columns" v-model="transferSettings.relayUrl" @blur="onTransferInput('relayUrl', $event)" placeholder="wss://relay.example/ws"/>
        </div>
        <div class="srow">
            <label class="three columns" for="collectTransferToken">{{ $t('CTRANSFER_TOKEN_LABEL') }}</label>
            <div class="seven columns collect-transfer-token-field">
                <input type="text" id="collectTransferToken" class="u-full-width" v-model="transferSettings.token" @blur="onTransferInput('token', $event)" placeholder="token-xyz" autocomplete="off"/>
                <button type="button" class="button-secondary token-generate-btn" @click="generateTransferToken">{{ $t('CTRANSFER_TOKEN_GENERATE') }}</button>
            </div>
        </div>
        <div class="srow">
            <div class="three columns"></div>
            <div class="seven columns">
                <button type="button" class="button-link" @click="toggleTransferAdvanced">{{ advancedToggleLabel }}</button>
            </div>
        </div>
        <div v-if="showTransferAdvanced" class="collect-transfer-advanced">
            <div class="srow">
                <label class="three columns" for="collectTransferUser">{{ $t('CTRANSFER_USER_ID_LABEL') }}</label>
                <input type="text" id="collectTransferUser" class="seven columns" v-model="transferSettings.userId" @blur="onTransferInput('userId', $event)" placeholder="user123"/>
            </div>
            <div class="srow checkbox-row">
                <label>
                    <input type="checkbox" :checked="transferSettings.iceUseTurn" @change="onTransferCheckbox('iceUseTurn', $event)" />
                    <span>{{ $t('CTRANSFER_USE_TURN') }}</span>
                </label>
            </div>
            <p class="info-text" v-if="transferSettings.iceUseTurn">{{ $t('CTRANSFER_TURN_HINT') }}</p>
            <div class="srow" v-if="transferSettings.iceUseTurn">
                <label class="three columns" for="collectTransferTurnUrl">{{ $t('CTRANSFER_TURN_URL_LABEL') }}</label>
                <input type="text" id="collectTransferTurnUrl" class="seven columns" v-model="transferSettings.turnUrl" @blur="onTransferInput('turnUrl', $event)" placeholder="turn:turn.example.org:3478" autocomplete="off"/>
            </div>
            <div class="srow" v-if="transferSettings.iceUseTurn">
                <label class="three columns" for="collectTransferTurnUser">{{ $t('CTRANSFER_TURN_USER_LABEL') }}</label>
                <input type="text" id="collectTransferTurnUser" class="seven columns" v-model="transferSettings.turnUsername" @blur="onTransferInput('turnUsername', $event)" placeholder="optional username" autocomplete="off"/>
            </div>
            <div class="srow" v-if="transferSettings.iceUseTurn">
                <label class="three columns" for="collectTransferTurnPass">{{ $t('CTRANSFER_TURN_PASS_LABEL') }}</label>
                <input type="password" id="collectTransferTurnPass" class="seven columns" v-model="transferSettings.turnPassword" @blur="onTransferInput('turnPassword', $event)" placeholder="optional password" autocomplete="off"/>
            </div>
        </div>
        <div class="srow checkbox-row">
            <label>
                <input type="checkbox" :checked="transferSettings.autoSend" @change="onTransferCheckbox('autoSend', $event)" />
                <span>{{ $t('CTRANSFER_AUTO_SEND') }}</span>
            </label>
        </div>
        <div class="srow checkbox-row">
            <label>
                <input type="checkbox" :checked="transferSettings.autoReconnect" @change="onTransferCheckbox('autoReconnect', $event)" />
                <span>{{ $t('CTRANSFER_AUTO_RECONNECT') }}</span>
            </label>
        </div>
        <p class="info-text">{{ $t('CTRANSFER_CONNECT_HINT') }}</p>
        <div class="srow">
            <label class="three columns">{{ $t('CTRANSFER_STATUS_LABEL') }}</label>
            <div class="seven columns collect-transfer-status-copy">
                <span>{{ transferStatusText }}</span>
                <i v-if="isTransferConnecting" class="fas fa-spinner fa-spin status-spinner" aria-hidden="true"></i>
            </div>
        </div>
        <div class="srow" v-if="transferStatus.state === 'error' && transferStatus.details && transferStatus.details.message">
            <span class="error-text">{{ transferStatus.details.message }}</span>
        </div>
        <div class="srow">
            <button type="button" class="button-primary" @click="toggleTransferConnection" :disabled="connectButtonDisabled">
                {{ isTransferConnected ? $t('CTRANSFER_DISCONNECT') : $t('CTRANSFER_CONNECT') }}
            </button>
        </div>
        <div class="srow share-actions">
            <button type="button" @click="openTransferShare" :disabled="!canConnect">{{ $t('CTRANSFER_SHARE_BUTTON') }}</button>
            <button type="button" @click="openTransferImport">{{ $t('CTRANSFER_IMPORT_BUTTON') }}</button>
        </div>
        <p class="info-text">{{ $t('CTRANSFER_OPEN_CONTROLS_HINT') }}</p>

        <h3>{{ $t('Matrix messenger') }}</h3>
        <div class="srow">
            <button @click="currentModal = MODALS.MODAL_MATRIX"><i class="fas fa-cog"></i> Configure matrix messenger</button>
        </div>
        <configure-matrix v-if="currentModal === MODALS.MODAL_MATRIX" @close="currentModal = null"></configure-matrix>
        <div v-if="currentModal === MODALS.MODAL_TRANSFER_QR" class="transfer-modal-overlay" @click.self="closeModal">
            <div class="transfer-modal-card" role="dialog" aria-modal="true" :aria-label="$t('CTRANSFER_QR_TITLE')">
                <h4>{{ $t('CTRANSFER_QR_TITLE') }}</h4>
                <p class="info-text">{{ $t('CTRANSFER_QR_EXPLAIN_TOKEN') }}</p>
                <div class="qr-wrapper">
                    <div v-if="qrGenerating" class="modal-spinner"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i></div>
                    <img v-else-if="transferQrDataUrl" :src="transferQrDataUrl" class="qr-image" alt="QR"/>
                </div>
                <div v-if="transferShareToken" class="token-section">
                    <label class="share-code-label">{{ $t('CTRANSFER_PAIRING_TOKEN_LABEL') }}</label>
                    <div class="token-display" aria-live="polite">{{ transferShareToken }}</div>
                    <div class="modal-actions separated">
                        <button type="button" class="button-primary" @click="copyShareToken" :disabled="!transferShareToken">{{ $t('CTRANSFER_COPY_TOKEN_BUTTON') }}</button>
                    </div>
                </div>
                <div v-if="qrError" class="error-text">{{ qrError }}</div>
                <label class="share-code-label" for="transferShareCode">{{ $t('CTRANSFER_SHARE_CODE_LABEL') }}</label>
                <textarea id="transferShareCode" class="share-code-box" readonly :value="transferShareCode"></textarea>
                <div v-if="copyFeedback" class="helper-text">{{ copyFeedback }}</div>
                <div class="modal-actions">
                    <button type="button" class="button-secondary" @click="copyShareCode" :disabled="!transferShareCode">{{ $t('CTRANSFER_COPY_BUTTON') }}</button>
                    <button type="button" @click="closeModal">{{ $t('close') }}</button>
                </div>
            </div>
        </div>
        <div v-if="currentModal === MODALS.MODAL_TRANSFER_IMPORT" class="transfer-modal-overlay" @click.self="closeModal">
            <div class="transfer-modal-card" role="dialog" aria-modal="true" :aria-label="$t('CTRANSFER_IMPORT_TITLE')">
                <h4>{{ $t('CTRANSFER_IMPORT_TITLE') }}</h4>
                <p class="info-text">{{ $t('CTRANSFER_IMPORT_EXPLAIN') }}</p>
                <textarea v-model="importCode" class="share-code-box" :placeholder="$t('CTRANSFER_IMPORT_PLACEHOLDER')"></textarea>
                <div v-if="importError" class="error-text">{{ importError }}</div>
                <div v-if="importPreview" class="import-preview">
                    <div><strong>{{ $t('CTRANSFER_IMPORT_RELAY_URL') }}:</strong> <code>{{ importPreview.settings.relayUrl }}</code></div>
                    <div><strong>{{ $t('CTRANSFER_IMPORT_TOKEN') }}:</strong> <code>{{ importPreview.settings.token }}</code></div>
                    <div v-if="canApplyImport" class="helper-text">{{ $t('CTRANSFER_IMPORT_READY') }}</div>
                </div>
                <div v-if="cameraSupported" class="scan-section">
                    <video v-show="qrScanActive" ref="transferQrVideo" class="import-video" muted playsinline></video>
                    <button type="button" @click="qrScanActive ? stopCameraScan() : startCameraScan()">{{ qrScanActive ? $t('CTRANSFER_SCAN_STOP') : $t('CTRANSFER_SCAN_START') }}</button>
                </div>
                <div class="modal-actions">
                    <button type="button" class="button-primary" @click="applyShareCode" :disabled="!canApplyImport">{{ $t('CTRANSFER_IMPORT_APPLY') }}</button>
                    <button type="button" @click="closeModal">{{ $t('close') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from '../../../js/externals/jquery.js';
    import { constants } from '../../../js/util/constants';
    import { collectTransferService } from '../../../js/service/collectTransferService';
    import QRCode from 'qrcode';
    import { BrowserMultiFormatReader } from '@zxing/browser';
    import { i18nService } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import { speechServiceExternal } from '../../../js/service/speechServiceExternal';
    import { speechService } from '../../../js/service/speechService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import ConfigureMatrix from '../../modals/matrix-messenger/configure-matrix.vue';

    const MODAL_MATRIX = 'MODAL_MATRIX';
    const MODAL_TRANSFER_QR = 'MODAL_TRANSFER_QR';
    const MODAL_TRANSFER_IMPORT = 'MODAL_TRANSFER_IMPORT';
    const MODALS = { MODAL_MATRIX, MODAL_TRANSFER_QR, MODAL_TRANSFER_IMPORT };

    export default {
        components: { ConfigureMatrix },
        props: ["metadata", "userSettingsLocal", "appSettings"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                i18nService: i18nService,
                util: util,
                arasaacService: arasaacService,
                urlValid: null,
                MODALS: MODALS,
                currentModal: null,
                transferSettings: collectTransferService.getSettings(),
                transferStatus: collectTransferService.getStatus(),
                statusHandler: null,
                userChangedHandler: null,
                transferShareCode: '',
                transferShareToken: '',
                transferQrDataUrl: '',
                qrGenerating: false,
                qrError: null,
                copyFeedback: null,
                importCode: '',
                importError: null,
                qrReader: null,
                qrReaderControls: null,
                qrScanActive: false,
                cameraSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                showTransferAdvanced: false
            }
        },
        computed: {
            isTransferConnected() {
                return this.transferStatus && this.transferStatus.state === 'connected';
            },
            isTransferConnecting() {
                return this.transferStatus && this.transferStatus.state === 'connecting';
            },
            canConnect() {
                return this.hasRequiredConfig(this.transferSettings);
            },
            connectButtonDisabled() {
                return (!this.isTransferConnected && !this.canConnect) || (this.isTransferConnecting && !this.isTransferConnected);
            },
            importPreview() {
                const trimmed = (this.importCode || '').trim();
                if (!trimmed) return null;
                const result = collectTransferService.parseShareCode(trimmed);
                return result && result.success ? result.descriptor : null;
            },
            canApplyImport() {
                const d = this.importPreview;
                return !!(d && d.settings && d.settings.relayUrl && d.settings.token);
            },
            advancedToggleLabel() {
                return this.showTransferAdvanced ? this.$t('CTRANSFER_ADVANCED_HIDE') : this.$t('CTRANSFER_ADVANCED_SHOW');
            },
            transferStatusText() {
                const state = (this.transferStatus && this.transferStatus.state) || 'disconnected';
                const details = (this.transferStatus && this.transferStatus.details) || {};
                if (state === 'connected') {
                    return this.$t('CTRANSFER_STATUS_CONNECTED', this.transferSettings.token || this.$t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER'));
                }
                if (state === 'connecting') {
                    const stageText = this.getStageText(details);
                    return stageText || this.$t('CTRANSFER_STATUS_CONNECTING');
                }
                if (state === 'error') {
                    if (details.reason === 'missing_configuration') {
                        return this.$t('CTRANSFER_ERROR_MISSING_CONFIG');
                    }
                    if (details.reason === 'missing_turn') {
                        return this.$t('CTRANSFER_ERROR_MISSING_TURN');
                    }
                    return this.$t('CTRANSFER_STATUS_ERROR');
                }
                if (!this.canConnect) {
                    return this.$t('CTRANSFER_ERROR_MISSING_CONFIG');
                }
                return this.$t('CTRANSFER_STATUS_DISCONNECTED');
            }
        },
        methods: {
            getStageText(details = {}) {
                const stage = details && details.stage;
                if (!stage) {
                    return '';
                }
                const key = `CTRANSFER_STAGE_${stage.toUpperCase()}`;
                const fallback = key;
                let param;
                switch (stage) {
                    case 'awaiting_partner':
                        param = details.token || this.transferSettings.token || this.$t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER');
                        break;
                    case 'waiting_peer':
                        param = details.peer || this.$t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER');
                        break;
                    default:
                        if (details.peer) {
                            param = details.peer;
                        }
                        break;
                }
                let textValue;
                if (typeof param !== 'undefined') {
                    textValue = this.$t(key, param);
                } else {
                    textValue = this.$t(key);
                }
                if (textValue && textValue !== fallback) {
                    return textValue;
                }
                return '';
            },
            hasRequiredConfig(settings) {
                if (!settings) {
                    return false;
                }
                const relay = (settings.relayUrl || '').trim();
                const token = (settings.token || '').trim();
                if (!relay || !token) {
                    return false;
                }
                if (settings.iceUseTurn) {
                    const turnUrl = (settings.turnUrl || '').trim();
                    if (!turnUrl) {
                        return false;
                    }
                }
                return true;
            },
            hasAdvancedValues(settings = this.transferSettings) {
                if (!settings) {
                    return false;
                }
                return Boolean((settings.userId || '').trim() || settings.iceUseTurn || (settings.turnUrl || '').trim() || (settings.turnUsername || '').trim() || (settings.turnPassword || '').length);
            },
            toggleTransferAdvanced() {
                this.showTransferAdvanced = !this.showTransferAdvanced;
            },
            generateTransferToken() {
                const token = collectTransferService.generateToken();
                collectTransferService.updateSettings({ token });
                this.refreshTransferSettings();
            },
            refreshTransferSettings() {
                const nextSettings = { ...collectTransferService.getSettings() };
                this.transferSettings = nextSettings;
                if (this.hasAdvancedValues(nextSettings)) {
                    this.showTransferAdvanced = true;
                }
            },
            refreshTransferStatus() {
                this.transferStatus = collectTransferService.getStatus();
            },
            async onSpeechUrlInput() {
                let savedSomething = await this.saveAppSettings(this.appSettings);
                if (savedSomething) {
                    this.urlValid = undefined;
                    this.urlValid = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                    this.urlValid = this.appSettings.externalSpeechServiceUrl ? this.urlValid : null;
                    let timeout = this.urlValid ? 0 : 3000;
                    util.debounce(async () => {
                        await speechService.reinit();
                    }, timeout, 'REINIT_SPEECH');
                }
            },
            onTransferInput(field, event) {
                collectTransferService.updateSettings({ [field]: event.target.value });
                this.refreshTransferSettings();
                if (['userId', 'turnUrl', 'turnUsername', 'turnPassword'].includes(field)) {
                    this.showTransferAdvanced = true;
                }
            },
            onTransferCheckbox(field, event) {
                collectTransferService.updateSettings({ [field]: event.target.checked });
                this.refreshTransferSettings();
                if (field === 'iceUseTurn' && event.target.checked) {
                    this.showTransferAdvanced = true;
                }
            },
            toggleTransferConnection() {
                if (this.isTransferConnected || this.isTransferConnecting) {
                    collectTransferService.disconnect();
                    return;
                }
                if (this.canConnect) {
                    collectTransferService.connect();
                }
            },
            async openTransferShare() {
                this.qrError = null;
                this.copyFeedback = null;
                const result = collectTransferService.getShareCode();
                if (!result.success) {
                    this.qrError = this.$t('CTRANSFER_ERROR_MISSING_CONFIG');
                    return;
                }
                this.transferShareCode = result.code;
                this.transferShareToken = (result.descriptor && result.descriptor.settings && result.descriptor.settings.token) || '';
                this.qrGenerating = true;
                this.transferQrDataUrl = '';
                this.currentModal = MODALS.MODAL_TRANSFER_QR;
                try {
                    this.transferQrDataUrl = await QRCode.toDataURL(result.code, { margin: 1, scale: 6 });
                } catch (err) {
                    console.error('[collectTransfer] failed to generate QR code', err);
                    this.qrError = this.$t('CTRANSFER_QR_ERROR');
                } finally {
                    this.qrGenerating = false;
                }
            },
            closeModal() {
                this.stopCameraScan();
                this.currentModal = null;
                this.qrGenerating = false;
                this.qrError = null;
                this.copyFeedback = null;
                this.importError = null;
            },
            async copyShareCode() {
                if (!this.transferShareCode) {
                    return;
                }
                try {
                    await navigator.clipboard.writeText(this.transferShareCode);
                    this.copyFeedback = this.$t('CTRANSFER_COPY_SUCCESS');
                } catch (err) {
                    console.warn('[collectTransfer] failed to copy share code', err);
                    this.copyFeedback = this.$t('CTRANSFER_COPY_ERROR');
                }
            },
            async copyShareToken() {
                if (!this.transferShareToken) {
                    return;
                }
                try {
                    await navigator.clipboard.writeText(this.transferShareToken);
                    this.copyFeedback = this.$t('CTRANSFER_COPY_SUCCESS');
                } catch (err) {
                    console.warn('[collectTransfer] failed to copy token', err);
                    this.copyFeedback = this.$t('CTRANSFER_COPY_ERROR');
                }
            },
            openTransferImport() {
                this.importCode = '';
                this.importError = null;
                this.copyFeedback = null;
                this.currentModal = MODALS.MODAL_TRANSFER_IMPORT;
            },
            applyShareCode() {
                this.importError = null;
                const trimmed = (this.importCode || '').trim();
                if (!trimmed) {
                    this.importError = this.$t('CTRANSFER_IMPORT_ERROR_EMPTY');
                    return;
                }
                const result = collectTransferService.importShareCode(trimmed);
                if (!result.success) {
                    const reason = result.reason || 'import_failed';
                    switch (reason) {
                        case 'missing_configuration':
                        case 'invalid_share_descriptor':
                        case 'invalid_share_settings':
                        case 'invalid_code':
                            this.importError = this.$t('CTRANSFER_IMPORT_ERROR_INVALID');
                            break;
                        default:
                            this.importError = this.$t('CTRANSFER_IMPORT_ERROR_UNKNOWN');
                    }
                    return;
                }
                this.refreshTransferSettings();
                this.refreshTransferStatus();
                this.closeModal();
            },
            async startCameraScan() {
                if (!this.cameraSupported || this.qrScanActive) {
                    return;
                }
                try {
                    if (!this.qrReader) {
                        this.qrReader = new BrowserMultiFormatReader();
                    }
                    this.qrScanActive = true;
                    this.importError = null;
                    this.qrReaderControls = await this.qrReader.decodeFromVideoDevice(
                        undefined,
                        this.$refs.transferQrVideo,
                        (result, err, controls) => {
                            if (result) {
                                this.importCode = result.getText();
                                this.applyShareCode();
                                if (controls) {
                                    controls.stop();
                                }
                                this.qrScanActive = false;
                            }
                        }
                    );
                } catch (err) {
                    console.warn('[collectTransfer] failed to start QR scan', err);
                    this.importError = this.$t('CTRANSFER_SCAN_NOT_AVAILABLE');
                    this.qrScanActive = false;
                }
            },
            stopCameraScan() {
                if (this.qrReaderControls && typeof this.qrReaderControls.stop === 'function') {
                    this.qrReaderControls.stop();
                }
                this.qrReaderControls = null;
                this.qrScanActive = false;
            }
        },
        mounted() {
            this.refreshTransferSettings();
            this.refreshTransferStatus();
            this.statusHandler = (event, newStatus) => {
                this.transferStatus = newStatus;
                this.refreshTransferSettings();
            };
            $(document).on(constants.EVENT_COLLECT_TRANSFER_STATUS, this.statusHandler);
            this.userChangedHandler = () => {
                this.refreshTransferSettings();
            };
            $(document).on(constants.EVENT_USER_CHANGED, this.userChangedHandler);
        },
        beforeDestroy() {
            if (this.statusHandler) {
                $(document).off(constants.EVENT_COLLECT_TRANSFER_STATUS, this.statusHandler);
            }
            if (this.userChangedHandler) {
                $(document).off(constants.EVENT_USER_CHANGED, this.userChangedHandler);
            }
            this.stopCameraScan();
        }
    }
</script>

<style scoped>
    .fa-info-circle {
        color: #266697;
        margin-right: 0.25em;
    }
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
    .info-text {
        margin: 0 0 1em 0;
        color: #555;
    }
    .checkbox-row label {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }
    .collect-transfer-status-copy {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }
    .status-spinner {
        color: #266697;
    }
    .error-text {
        color: #c0392b;
        margin-left: 3rem;
    }
    .share-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .transfer-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2100;
        padding: 1rem;
    }
    .transfer-modal-card {
        background: #fff;
        color: #333;
        max-width: 26rem;
        width: 100%;
        padding: 1.5rem;
        border-radius: 6px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .qr-wrapper { display: flex; justify-content: center; align-items: center; margin: 0.5rem 0 1rem; }
    .qr-image { width: min(80vw, 18rem); height: auto; image-rendering: pixelated; }
    .share-code-box { width: 100%; min-height: 5rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.9rem; padding: 0.5rem; resize: vertical; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
    .modal-spinner { display: flex; justify-content: center; }
    .helper-text { color: #2c3e50; font-size: 0.9rem; }
    .token-section { margin: 0.5rem 0 1rem; }
    .token-display { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 1.4rem; letter-spacing: 0.06em; padding: 0.5rem 0.75rem; background: #f6f8fa; border-radius: 6px; word-break: break-all; text-align: center; }
    .modal-actions.separated { margin-top: 0.5rem; }
    .import-preview { background: #f6f8fa; border-radius: 6px; padding: 0.5rem 0.75rem; margin: 0.5rem 0 1rem; }
    .import-video { width: 100%; max-height: 12rem; background: #000; border-radius: 4px; }
    .scan-section { display: flex; flex-direction: column; gap: 0.5rem; }
</style>
