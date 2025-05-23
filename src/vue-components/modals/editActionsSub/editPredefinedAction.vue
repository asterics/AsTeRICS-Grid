<template>
    <div class="container-fluid px-0">
        <div class="row" v-if="actionGroups">
            <label class="col-12 col-md-4 normal-text" for="actionGroup-123">{{ $t('actionGroup') }}</label>
            <div class="col-12 col-md-7">
                <select id="actionGroup-123" v-model="action.groupId" class="col-12" @change="groupChanged">
                    <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                    <option v-for="group in actionGroups" :value="group.id">{{ i18nService.tPredefined(group.name) }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="actionInfos.length > 0">
            <label class="col-12 col-md-4 normal-text" for="actionInfo-123">{{ $t('actionName') }}</label>
            <div class="col-12 col-md-7">
                <select id="actionInfo-123" v-model="action.actionInfo" class="col-12" @change="actionInfoChanged">
                    <option :value="{}" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                    <option v-for="info in actionInfos" :value="info">{{ i18nService.tPredefined(info.name) }}</option>
                </select>
            </div>
        </div>
        <div v-if="customValues.length">
            <div v-for="customValue in customValues">
                <div class="row" v-if="customValue.type === 'text'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ i18nService.tPredefined(customValue.name) }}</label>
                    <div class="col-12 col-md-7">
                        <input class="col-12" :id="customValue.name" v-model="action.customValues[customValue.name]" @input="textChanged(customValue)" spellcheck="false"
                               type="text" :placeholder="i18nService.tPredefined(customValue.placeholder)"/>
                    </div>
                </div>
                <div class="row" v-if="customValue.type === 'number'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ i18nService.tPredefined(customValue.name) }}</label>
                    <div class="col-12 col-md-7">
                        <input class="col-12" :id="customValue.name" v-model.number="action.customValues[customValue.name]"
                               type="number" :min="customValue.min" :max="customValue.max" :step="customValue.step" :placeholder="i18nService.tPredefined(customValue.placeholder)"/>
                    </div>
                </div>
                <div class="row" v-if="customValue.type === 'select'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ i18nService.tPredefined(customValue.name) }}</label>
                    <div class="col-12 col-md-7">
                        <select class="col-12" :id="customValue.name" v-model="action.customValues[customValue.name]">
                            <option v-for="value in customValue.values" :value="value.value ? value.value : value">{{ i18nService.tPredefined(value.label ? value.label : value) }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import { util } from '../../../js/util/util';
import { actionService } from '../../../js/service/actionService';
import { i18nService } from '../../../js/service/i18nService';

export default {
    props: ['action', 'gridData'],
    data: function() {
        return {
            actionGroups: null,
            updateCounter1: 0,
            updateCounter2: 0,
            updateCounter3: 0,
            i18nService: i18nService
        };
    },
    computed: {
        customValues() {
            this.updateCounter1--;
            if (!this.action.groupId || !this.action.actionInfo || !this.actionGroups) {
                return [];
            }
            let group = this.actionGroups.find(d => d.id === this.action.groupId) || {};
            let actions = group.actions || [];
            let action = actions.find(a => a.name === this.action.actionInfo.name) || {};
            return action.customValues || [];
        },
        actionInfos() {
            this.updateCounter2--;
            if(!this.action.groupId || !this.actionGroups) {
                return [];
            }
            let group = this.actionGroups.find(d => d.id === this.action.groupId) || {};
            return group.actions || [];
        },
        currentGroup() {
            this.updateCounter3--;
            if (!this.action.groupId || !this.actionGroups) {
                return null;
            }
            return this.actionGroups.find(g => g.id === this.action.groupId)
        }
    },
    watch: {
        customValues() {
            if (!this.customValues) {
                return;
            }
            for (let customValue of this.customValues) {
                if (!this.action.customValues[customValue.name] && customValue.type === 'select') {
                    let valueOrObject = customValue.values[0];
                    this.action.customValues[customValue.name] = valueOrObject.value ? valueOrObject.value : valueOrObject;
                }
            }
        }
    },
    methods: {
        textChanged(customValueInfo) {
            util.debounce(() => {
                let currentValue = this.action.customValues[customValueInfo.name];
                if (!currentValue) {
                    return;
                }
                if (customValueInfo.autoStartWith) {
                    let autoStartValues = customValueInfo.autoStartWith instanceof Array ? customValueInfo.autoStartWith : [customValueInfo.autoStartWith];
                    if (autoStartValues.every(value => !currentValue.startsWith(value))) {
                        currentValue = autoStartValues[0] + currentValue;
                    }
                }
                if (customValueInfo.mustMatch) {
                    let regex = new RegExp(customValueInfo.mustMatch);
                    if (!regex.test(currentValue)) {
                        log.warn(currentValue, 'does not match', customValueInfo.mustMatch);
                    }
                }
                this.action.customValues[customValueInfo.name] = currentValue;
            }, 300, 'PREDEF_ACTIONS_TXT_CHG');
        },
        groupChanged() {
            this.$set(this.action, "actionInfo", {});
            this.$set(this.action, "customValues", {});
            this.updateCounter1++;
            this.updateCounter2++;
            this.updateCounter3++;
            this.$nextTick(() => {
                this.$emit("change");
                if (!this.currentGroup || !this.currentGroup.actions) {
                    return;
                }
                if (this.currentGroup.actions.length === 1) {
                    this.action.actionInfo = this.currentGroup.actions[0];
                    this.actionInfoChanged();
                }
            });
        },
        actionInfoChanged() {
            this.$set(this.action, "customValues", {});
            this.updateCounter1++;
            this.$nextTick(() => {
                this.$emit("change");
            })
        }
    },
    async mounted() {
        if (this.action.isLiveAction) {
            this.actionGroups = await actionService.getPredefinedRequestInfos();
        } else {
            this.actionGroups = await actionService.getPredefinedActionInfos();
        }

        // set action info to current value got from API in order to pre-select the correct item for "actionName"
        let currentGroup = this.actionGroups.find(group => group.id === this.action.groupId) || {};
        let currentActions = currentGroup.actions || [];
        this.action.actionInfo = currentActions.find(a => a.name === this.action.actionInfo.name) || this.action.actionInfo;
    }
}
</script>

<style scoped>
.normal-text {
    font-weight: normal;
}

.row {
    margin-bottom: 1em;
}
</style>