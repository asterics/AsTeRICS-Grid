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
            <label class="three columns" for="collectTransferRoom">{{ $t('CTRANSFER_ROOM_ID_LABEL') }}</label>
            <input type="text" id="collectTransferRoom" class="seven columns" v-model="transferSettings.roomId" @blur="onTransferInput('roomId', $event)" placeholder="room:example"/>
        </div>
        <div class="srow">
            <label class="three columns" for="collectTransferToken">{{ $t('CTRANSFER_TOKEN_LABEL') }}</label>
            <input type="text" id="collectTransferToken" class="seven columns" v-model="transferSettings.token" @blur="onTransferInput('token', $event)" placeholder="token-xyz" autocomplete="off"/>
        </div>
        <div class="srow">
            <label class="three columns" for="collectTransferUser">{{ $t('CTRANSFER_USER_ID_LABEL') }}</label>
            <input type="text" id="collectTransferUser" class="seven columns" v-model="transferSettings.userId" @blur="onTransferInput('userId', $event)" placeholder="user123"/>
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
        <p class="info-text">{{ $t('CTRANSFER_OPEN_CONTROLS_HINT') }}</p>

        <h3>{{ $t('Matrix messenger') }}</h3>
        <div class="srow">
            <button @click="currentModal = MODALS.MODAL_MATRIX"><i class="fas fa-cog"></i> Configure matrix messenger</button>
        </div>
        <configure-matrix v-if="currentModal === MODALS.MODAL_MATRIX" @close="currentModal = null"></configure-matrix>
    </div>
</template>

<script>
    import $ from '../../../js/externals/jquery.js';
    import { constants } from '../../../js/util/constants';
    import { collectTransferService } from '../../../js/service/collectTransferService';
    import { i18nService } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import { speechServiceExternal } from '../../../js/service/speechServiceExternal';
    import { speechService } from '../../../js/service/speechService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import ConfigureMatrix from '../../modals/matrix-messenger/configure-matrix.vue';

    const MODAL_MATRIX = 'MODAL_MATRIX';
    const MODALS = { MODAL_MATRIX };

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
                userChangedHandler: null
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
            transferStatusText() {
                const state = (this.transferStatus && this.transferStatus.state) || 'disconnected';
                const details = (this.transferStatus && this.transferStatus.details) || {};
                if (state === 'connected') {
                    return this.$t('CTRANSFER_STATUS_CONNECTED', this.transferSettings.roomId || '');
                }
                if (state === 'connecting') {
                    return this.$t('CTRANSFER_STATUS_CONNECTING');
                }
                if (state === 'error') {
                    if (details.reason === 'missing_configuration') {
                        return this.$t('CTRANSFER_ERROR_MISSING_CONFIG');
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
            hasRequiredConfig(settings) {
                if (!settings) {
                    return false;
                }
                const relay = (settings.relayUrl || '').trim();
                const room = (settings.roomId || '').trim();
                const token = (settings.token || '').trim();
                return !!(relay && room && token);
            },
            refreshTransferSettings() {
                this.transferSettings = { ...collectTransferService.getSettings() };
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
            },
            onTransferCheckbox(field, event) {
                collectTransferService.updateSettings({ [field]: event.target.checked });
                this.refreshTransferSettings();
            },
            toggleTransferConnection() {
                if (this.isTransferConnected || this.isTransferConnecting) {
                    collectTransferService.disconnect();
                    return;
                }
                if (this.canConnect) {
                    collectTransferService.connect();
                }
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
</style>
