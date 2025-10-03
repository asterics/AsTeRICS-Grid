<template>
    <div class="grid-item-content message-history-container">
        <div class="message-history-header" v-if="showHeader">
            <span class="header-title">{{ $t('messageHistory') }}</span>
            <button class="btn-clear" v-if="showClearButton" @click="clearHistory" :title="$t('clearHistory')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="message-history-list" :class="{ scrollable: scrollable }" ref="historyList">
            <div 
                v-for="(utterance, index) in displayedUtterances" 
                :key="utterance.id || index"
                class="message-history-item"
                :class="{ 'clickable': isClickable }"
                @click="selectUtterance(utterance)"
                :style="{ height: itemHeight + 'px' }"
            >
                <div class="message-text">{{ utterance.text }}</div>
                <div class="message-meta" v-if="showTimestamp || showFrequency">
                    <span v-if="showTimestamp" class="timestamp">
                        {{ formatTimestamp(utterance.timestamp) }}
                    </span>
                    <span v-if="showFrequency" class="frequency">
                        {{ $t('used') }}: {{ utterance.frequency }}x
                    </span>
                </div>
            </div>
            <div v-if="displayedUtterances.length === 0" class="no-messages">
                {{ $t('noMessagesFound') }}
            </div>
        </div>
    </div>
</template>

<script>
import { utteranceLoggingService } from '../../../js/service/utteranceLoggingService.js';
import { speechService } from '../../../js/service/speechService.js';
import { collectElementService } from '../../../js/service/collectElementService.js';
import { i18nService } from '../../../js/service/i18nService.js';
import { constants } from '../../../js/util/constants.js';
import { GridActionMessageHistory } from '../../../js/model/GridActionMessageHistory.js';
import $ from '../../../js/externals/jquery.js';

export default {
    props: ['gridElement', 'gridData'],
    data() {
        return {
            displayedUtterances: [],
            refreshInterval: null
        }
    },
    computed: {
        maxItems() {
            return this.gridElement.maxItems || 10;
        },
        sortBy() {
            return this.gridElement.sortBy || 'recent';
        },
        language() {
            return this.gridElement.language || null;
        },
        showTimestamp() {
            return this.gridElement.showTimestamp !== false;
        },
        showFrequency() {
            return this.gridElement.showFrequency === true;
        },
        itemHeight() {
            return this.gridElement.itemHeight || 40;
        },
        scrollable() {
            return this.gridElement.scrollable !== false;
        },
        showHeader() {
            return this.gridElement.height > 2; // Only show header for larger elements
        },
        showClearButton() {
            return this.showHeader && this.displayedUtterances.length > 0;
        },
        isClickable() {
            return true; // Messages are always clickable to speak or add to collect
        }
    },
    methods: {
        refreshUtterances() {
            if (!utteranceLoggingService.isEnabled()) {
                this.displayedUtterances = [];
                return;
            }

            const options = {
                limit: this.maxItems,
                language: this.language,
                sortBy: this.sortBy
            };

            this.displayedUtterances = utteranceLoggingService.getUtterances(options);
        },
        selectUtterance(utterance) {
            // Add to collect element if available, otherwise speak directly
            if (collectElementService.hasRegisteredCollectElements()) {
                // Add to collect element
                collectElementService.addText(utterance.text);
            } else {
                // Speak directly
                speechService.speak(utterance.text, {
                    sourceContext: 'message-history'
                });
            }
        },
        clearHistory() {
            if (confirm(this.$t('confirmClearHistory'))) {
                utteranceLoggingService.clearHistory().then(() => {
                    this.refreshUtterances();
                });
            }
        },
        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) {
                return this.$t('justNow');
            } else if (diffMins < 60) {
                return this.$t('minutesAgo', diffMins);
            } else if (diffHours < 24) {
                return this.$t('hoursAgo', diffHours);
            } else if (diffDays < 7) {
                return this.$t('daysAgo', diffDays);
            } else {
                return date.toLocaleDateString();
            }
        },
        setupEventListeners() {
            // Listen for new utterances
            $(document).on(constants.EVENT_UTTERANCE_LOGGED + '.messageHistory', () => {
                this.refreshUtterances();
            });
        },
        cleanupEventListeners() {
            $(document).off('.messageHistory');
        }
    },
    mounted() {
        this.refreshUtterances();
        this.setupEventListeners();
        
        // Refresh periodically to update timestamps
        this.refreshInterval = setInterval(() => {
            this.refreshUtterances();
        }, 30000); // Refresh every 30 seconds
    },
    beforeDestroy() {
        this.cleanupEventListeners();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },
    watch: {
        gridElement: {
            handler() {
                this.refreshUtterances();
            },
            deep: true
        }
    }
}
</script>

<style scoped>
.message-history-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 5px;
    box-sizing: border-box;
}

.message-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #ddd;
    margin-bottom: 5px;
}

.header-title {
    font-weight: bold;
    font-size: 0.9em;
}

.btn-clear {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
}

.btn-clear:hover {
    background-color: #f0f0f0;
    color: #333;
}

.message-history-list {
    flex: 1;
    overflow: hidden;
}

.message-history-list.scrollable {
    overflow-y: auto;
}

.message-history-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 5px 8px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
}

.message-history-item.clickable {
    cursor: pointer;
}

.message-history-item.clickable:hover {
    background-color: #f5f5f5;
}

.message-text {
    font-size: 0.9em;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.message-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.7em;
    color: #666;
    margin-top: 2px;
}

.timestamp, .frequency {
    font-size: 0.8em;
}

.no-messages {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
    font-style: italic;
    text-align: center;
}
</style>
