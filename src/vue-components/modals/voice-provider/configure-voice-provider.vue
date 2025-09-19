
<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')">
                    <div class="modal-header">
                        <div class="row">
                            <h1 class="col">{{ $t('voiceProviderConfigureTitle') }}</h1>
                            <div class="col-auto d-flex">
                                <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="srow">
                            <label for="providerSelector">{{ $t('voiceProvider') }}</label>
                            <select id="providerSelector" v-model="activeProviderId">
                                <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ getProviderLabel(provider) }}</option>
                            </select>
                        </div>
                        <div v-if="!fields.length" class="srow">
                            {{ $t('voiceProviderNoConfigurationRequired') }}
                        </div>
                        <div v-else>
                            <div class="srow" v-for="field in fields" :key="field.key">
                                <label :for="fieldId(field)">{{ getFieldLabel(field) }}</label>
                                <input :id="fieldId(field)" :type="field.type || 'text'" v-model="localSettings[activeProviderId][field.key]"/>
                            </div>
                            <div class="srow validation-row">
                                <button class="three columns" @click="checkCredentials" :disabled="!canValidate || checking">
                                    <span v-if="checking"><i class="fas fa-spinner fa-spin"></i> {{ $t('checkingCredentials') }}</span>
                                    <span v-else>{{ $t('checkCredentials') }}</span>
                                </button>
                                <div class="validation-status nine columns">
                                    <span v-if="currentValidation && currentValidation.status === 'success'" class="status success">
                                        <i class="fas fa-check"></i> {{ $t('credentialsValid') }}
                                    </span>
                                    <span v-else-if="currentValidation && currentValidation.status === 'error'" class="status error">
                                        <i class="fas fa-times"></i> {{ $t('credentialsInvalid') }}
                                    </span>
                                    <span v-if="currentValidation && currentValidation.status === 'error' && currentValidation.message" class="status error details">
                                        {{ currentValidation.message }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container">
                            <div class="srow">
                                <button @click="save()" class="six columns offset-by-six">
                                    <i class="fas fa-check"></i> <span>{{ $t('closeModal') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../../css/modal.css';
    import { constants } from '../../../js/util/constants';
    import { voiceProviderService } from '../../../js/service/voiceProviderService';

    const PROVIDER_FIELDS = {
        [constants.VOICE_PROVIDER_AZURE]: [
            { key: 'subscriptionKey', labelKey: 'voiceProviderAzureSubscriptionKey', type: 'password' },
            { key: 'region', labelKey: 'voiceProviderAzureRegion', type: 'text' }
        ],
        [constants.VOICE_PROVIDER_ELEVENLABS]: [
            { key: 'apiKey', labelKey: 'voiceProviderElevenlabsApiKey', type: 'password' }
        ],
        [constants.VOICE_PROVIDER_WATSON]: [
            { key: 'apiKey', labelKey: 'voiceProviderWatsonApiKey', type: 'password' },
            { key: 'region', labelKey: 'voiceProviderWatsonRegion', type: 'text' },
            { key: 'instanceId', labelKey: 'voiceProviderWatsonInstanceId', type: 'text' }
        ],
        [constants.VOICE_PROVIDER_WITAI]: [
            { key: 'token', labelKey: 'voiceProviderWitaiToken', type: 'password' }
        ],
        [constants.VOICE_PROVIDER_UPLIFTAI]: [
            { key: 'apiKey', labelKey: 'voiceProviderUpliftaiApiKey', type: 'password' }
        ],
        [constants.VOICE_PROVIDER_PLAYHT]: [
            { key: 'apiKey', labelKey: 'voiceProviderPlayhtApiKey', type: 'password' },
            { key: 'userId', labelKey: 'voiceProviderPlayhtUserId', type: 'text' }
        ]
    };

    export default {
        props: {
            providers: { type: Array, required: true },
            selectedProvider: { type: String, required: true },
            settings: { type: Object, required: true }
        },
        data() {
            let localSettings = JSON.parse(JSON.stringify(this.settings || {}));
            return {
                activeProviderId: this.selectedProvider,
                localSettings,
                checking: false,
                validationStates: {}
            }
        },
        computed: {
            fields() {
                return PROVIDER_FIELDS[this.activeProviderId] || [];
            },
            currentValidation() {
                return this.validationStates[this.activeProviderId];
            },
            canValidate() {
                if (!this.fields.length) {
                    return false;
                }
                const config = this.localSettings[this.activeProviderId] || {};
                return this.fields.every((field) => !!config[field.key]);
            }
        },
        watch: {
            selectedProvider: {
                handler(newVal) {
                    this.activeProviderId = newVal;
                    this.ensureProviderSettings(newVal);
                },
                immediate: true
            },
            activeProviderId(newVal) {
                this.ensureProviderSettings(newVal);
            },
            localSettings: {
                handler() {
                    this.$delete(this.validationStates, this.activeProviderId);
                },
                deep: true
            }
        },
        methods: {
            getProviderLabel(provider) {
                if (!provider) {
                    return '';
                }
                if (provider.labelKey && this.$te(provider.labelKey)) {
                    return this.$t(provider.labelKey);
                }
                return provider.id;
            },
            getFieldLabel(field) {
                if (field.labelKey && this.$te(field.labelKey)) {
                    return this.$t(field.labelKey);
                }
                return field.key;
            },
            fieldId(field) {
                return `voice-provider-${this.activeProviderId}-${field.key}`;
            },
            ensureProviderSettings(providerId) {
                if (!this.localSettings[providerId]) {
                    this.$set(this.localSettings, providerId, {});
                }
            },
            async checkCredentials() {
                this.ensureProviderSettings(this.activeProviderId);
                const config = JSON.parse(JSON.stringify(this.localSettings[this.activeProviderId] || {}));
                this.checking = true;
                this.$delete(this.validationStates, this.activeProviderId);
                let result;
                try {
                    result = await voiceProviderService.checkCredentials(this.activeProviderId, config);
                } finally {
                    this.checking = false;
                }
                if (result && result.success) {
                    this.$set(this.validationStates, this.activeProviderId, { status: 'success' });
                    this.$emit('validated', { providerId: this.activeProviderId, settings: config });
                } else {
                    const messageKey = result && result.error === 'missingConfiguration' ? 'credentialsInvalidDetailsMissing' : null;
                    const message = result && result.error && result.error !== 'missingConfiguration' ? result.error : (messageKey ? this.$t(messageKey) : '');
                    this.$set(this.validationStates, this.activeProviderId, { status: 'error', message });
                }
            },
            save() {
                this.$emit('close');
            }
        },
        mounted() {
            this.ensureProviderSettings(this.activeProviderId);
        }
    }
</script>

<style scoped>
    .modal-container {
        min-width: 400px;
    }
    .srow {
        margin-bottom: 1.5em;
    }
    label {
        display: block;
        margin-bottom: 0.5em;
    }
    input,
    select {
        width: 100%;
    }
    .validation-row {
        align-items: center;
    }
    .validation-status {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }
    .status.success {
        color: #2e8b57;
    }
    .status.error {
        color: #b00020;
    }
    .status.details {
        font-size: 0.9em;
    }
</style>
