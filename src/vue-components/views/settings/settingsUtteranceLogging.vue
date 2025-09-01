<template>
    <div class="settings-utterance-logging">
        <div class="srow">
            <div class="eleven columns">
                <h3>{{ $t('utteranceLogging') }}</h3>
                <p class="info-text">{{ $t('utteranceLoggingDescription') }}</p>
                
                <!-- Enable/Disable Toggle -->
                <div class="srow">
                    <input 
                        id="chkEnableUtteranceLogging" 
                        type="checkbox" 
                        v-model="userSettingsLocal.utteranceLogging.enabled" 
                        @change="saveUserSettings()"
                    />
                    <label for="chkEnableUtteranceLogging">{{ $t('enableUtteranceLogging') }}</label>
                </div>

                <!-- Settings (only shown when enabled) -->
                <div v-if="userSettingsLocal.utteranceLogging.enabled" class="utterance-settings">
                    
                    <!-- Maximum number of utterances -->
                    <div class="srow">
                        <slider-input 
                            :label="'maxUtterances'" 
                            id="maxUtterances" 
                            min="100" 
                            max="5000" 
                            step="100" 
                            v-model.number="userSettingsLocal.utteranceLogging.maxUtterances" 
                            @change="saveUserSettings()"
                        />
                        <p class="help-text">{{ $t('maxUtterancesHelp') }}</p>
                    </div>

                    <!-- Maximum age in days -->
                    <div class="srow">
                        <slider-input 
                            :label="'maxAgeDays'" 
                            unit="days"
                            id="maxAgeDays" 
                            min="1" 
                            max="365" 
                            step="1" 
                            v-model.number="userSettingsLocal.utteranceLogging.maxAgeDays" 
                            @change="saveUserSettings()"
                        />
                        <p class="help-text">{{ $t('maxAgeDaysHelp') }}</p>
                    </div>

                    <!-- Minimum utterance length -->
                    <div class="srow">
                        <slider-input 
                            :label="'minUtteranceLength'" 
                            unit="characters"
                            id="minUtteranceLength" 
                            min="1" 
                            max="10" 
                            step="1" 
                            v-model.number="userSettingsLocal.utteranceLogging.minUtteranceLength" 
                            @change="saveUserSettings()"
                        />
                        <p class="help-text">{{ $t('minUtteranceLengthHelp') }}</p>
                    </div>

                    <!-- Log only manual speech -->
                    <div class="srow">
                        <input 
                            id="chkLogOnlyManualSpeech" 
                            type="checkbox" 
                            v-model="userSettingsLocal.utteranceLogging.logOnlyManualSpeech" 
                            @change="saveUserSettings()"
                        />
                        <label for="chkLogOnlyManualSpeech">{{ $t('logOnlyManualSpeech') }}</label>
                        <p class="help-text">{{ $t('logOnlyManualSpeechHelp') }}</p>
                    </div>

                    <!-- Exclude keyboard input -->
                    <div class="srow">
                        <input 
                            id="chkExcludeKeyboardInput" 
                            type="checkbox" 
                            v-model="userSettingsLocal.utteranceLogging.excludeKeyboardInput" 
                            @change="saveUserSettings()"
                        />
                        <label for="chkExcludeKeyboardInput">{{ $t('excludeKeyboardInput') }}</label>
                        <p class="help-text">{{ $t('excludeKeyboardInputHelp') }}</p>
                    </div>

                    <!-- Current statistics -->
                    <div class="srow statistics-section">
                        <h4>{{ $t('currentStatistics') }}</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">{{ $t('totalUtterances') }}:</span>
                                <span class="stat-value">{{ currentStats.totalUtterances }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">{{ $t('oldestUtterance') }}:</span>
                                <span class="stat-value">{{ formatDate(currentStats.oldestUtterance) }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">{{ $t('newestUtterance') }}:</span>
                                <span class="stat-value">{{ formatDate(currentStats.newestUtterance) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Clear history button -->
                    <div class="srow">
                        <button 
                            class="btn-clear-history" 
                            @click="clearHistory()"
                            :disabled="currentStats.totalUtterances === 0"
                        >
                            <i class="fas fa-trash"></i>
                            {{ $t('clearUtteranceHistory') }}
                        </button>
                        <p class="help-text warning">{{ $t('clearHistoryWarning') }}</p>
                    </div>
                </div>

                <!-- Privacy notice -->
                <div class="privacy-notice">
                    <h4>{{ $t('privacyNotice') }}</h4>
                    <p>{{ $t('utterancePrivacyNotice') }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { settingsSaveMixin } from './settingsSaveMixin.js';
import { utteranceLoggingService } from '../../../js/service/utteranceLoggingService.js';
import SliderInput from '../../modals/input/sliderInput.vue';

export default {
    components: { SliderInput },
    props: ["userSettingsLocal"],
    mixins: [settingsSaveMixin],
    data() {
        return {
            currentStats: {
                totalUtterances: 0,
                oldestUtterance: null,
                newestUtterance: null
            }
        }
    },
    methods: {
        saveUserSettings() {
            this.saveUserSettingsLocal(this.userSettingsLocal);
            // Update the utterance logging service with new settings
            utteranceLoggingService.updateSettings(this.userSettingsLocal.utteranceLogging);
            this.updateStats();
        },
        clearHistory() {
            if (confirm(this.$t('confirmClearUtteranceHistory'))) {
                utteranceLoggingService.clearHistory().then(() => {
                    this.updateStats();
                    this.$emit('show-tooltip', {
                        text: this.$t('utteranceHistoryCleared'),
                        type: 'success'
                    });
                }).catch(error => {
                    console.error('Failed to clear utterance history:', error);
                    this.$emit('show-tooltip', {
                        text: this.$t('failedToClearHistory'),
                        type: 'error'
                    });
                });
            }
        },
        updateStats() {
            if (!utteranceLoggingService.isEnabled()) {
                this.currentStats = {
                    totalUtterances: 0,
                    oldestUtterance: null,
                    newestUtterance: null
                };
                return;
            }

            const utterances = utteranceLoggingService.getUtterances({ limit: 1000 });
            this.currentStats.totalUtterances = utterances.length;
            
            if (utterances.length > 0) {
                const timestamps = utterances.map(u => u.timestamp).sort((a, b) => a - b);
                this.currentStats.oldestUtterance = timestamps[0];
                this.currentStats.newestUtterance = timestamps[timestamps.length - 1];
            } else {
                this.currentStats.oldestUtterance = null;
                this.currentStats.newestUtterance = null;
            }
        },
        formatDate(timestamp) {
            if (!timestamp) {
                return this.$t('none');
            }
            return new Date(timestamp).toLocaleDateString();
        }
    },
    mounted() {
        this.updateStats();
    },
    watch: {
        'userSettingsLocal.utteranceLogging.enabled'(newVal) {
            if (newVal) {
                this.updateStats();
            }
        }
    }
}
</script>

<style scoped>
.settings-utterance-logging {
    padding: 10px 0;
}

.info-text {
    color: #666;
    font-size: 0.9em;
    margin-bottom: 15px;
}

.utterance-settings {
    margin-left: 20px;
    padding: 15px;
    border-left: 3px solid #007cba;
    background-color: #f9f9f9;
}

.help-text {
    font-size: 0.8em;
    color: #666;
    margin-top: 5px;
    margin-bottom: 10px;
}

.help-text.warning {
    color: #d9534f;
}

.statistics-section {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
}

.stat-label {
    font-weight: bold;
}

.stat-value {
    color: #007cba;
}

.btn-clear-history {
    background-color: #d9534f;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
}

.btn-clear-history:hover:not(:disabled) {
    background-color: #c9302c;
}

.btn-clear-history:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.privacy-notice {
    margin-top: 20px;
    padding: 15px;
    background-color: #e7f3ff;
    border-left: 4px solid #007cba;
    border-radius: 4px;
}

.privacy-notice h4 {
    margin-top: 0;
    color: #007cba;
}

.privacy-notice p {
    margin-bottom: 0;
    font-size: 0.9em;
}
</style>
