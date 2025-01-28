<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="actionGroup-123">{{ $t('actionGroup') }}</label>
            <div class="col-12 col-md-7">
                <select id="actionGroup-123" v-model="action.groupId" class="col-12" @change="groupChanged">
                    <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                    <option v-for="group in actionGroups" :value="group.id">{{ group.name }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="actionInfos.length > 1">
            <label class="col-12 col-md-4 normal-text" for="actionInfo-123">{{ $t('actionName') }}</label>
            <div class="col-12 col-md-7">
                <select id="actionInfo-123" v-model="action.actionInfo" class="col-12" @change="actionInfoChanged">
                    <option v-for="info in actionGroups.find(d => d.id === action.groupId).actions" :value="info">{{ info.name }}</option>
                </select>
            </div>
        </div>
        <div v-if="customValues.length">
            <div v-for="customValue in customValues">
                <div class="row" v-if="customValue.type === 'text'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ customValue.name }}</label>
                    <div class="col-12 col-md-7">
                        <input class="col-12" :id="customValue.name" v-model="action.customValues[customValue.name]" @input="textChanged(customValue)" spellcheck="false"
                               type="text" :placeholder="customValue.placeholder"/>
                    </div>
                </div>
                <div class="row" v-if="customValue.type === 'number'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ customValue.name }}</label>
                    <div class="col-12 col-md-7">
                        <input class="col-12" :id="customValue.name" v-model.number="action.customValues[customValue.name]"
                               type="number" :min="customValue.min" :max="customValue.max" :step="customValue.step"/>
                    </div>
                </div>
                <div class="row" v-if="customValue.type === 'select'">
                    <label class="col-12 col-md-4 normal-text" :for="customValue.name">{{ customValue.name }}</label>
                    <div class="col-12 col-md-7">
                        <select class="col-12" :id="customValue.name" v-model="action.customValues[customValue.name]">
                            <option v-for="value in customValue.values" :value="value.value ? value.value : value">{{ value.label ? value.label : value }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import { util } from '../../../js/util/util';

export default {
    props: ['action', 'gridData'],
    computed: {
        customValues() {
            log.warn("HIER")
            if (!this.action.groupId || !this.action.actionInfo) {
                return [];
            }
            let actions = this.actionGroups.find(g => g.id === this.action.groupId).actions || [];
            let action = actions.find(a => a.name === this.action.actionInfo.name) || {};
            log.warn(action.customValues);
            return action.customValues || [];
        },
        actionInfos() {
            if(!this.action.groupId) {
                return [];
            }
            return this.actionGroups.find(d => d.id === this.action.groupId).actions || [];
        },
        currentGroup() {
            if (!this.action.groupId) {
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
            if (!this.currentGroup || !this.currentGroup.actions) {
                return;
            }
            if (this.currentGroup.actions.length === 1) {
                this.action.actionInfo = this.currentGroup.actions[0];
                log.warn("new auto action info", this.action.actionInfo)
            }
        },
        actionInfoChanged() {
            this.$set(this.action, "customValues", {});
        }
    },
    data: function() {
        return {
            actionGroups: [
                {
                    'id': 'Shelly_Plus_Plug_S_Gen1_HTTP_API',
                    'name': 'Shelly Plug S',
                    'actions': [
                        {
                            'name': 'TURN',
                            'actionModelName': 'GridActionHTTP',
                            'customValues': [
                                {
                                    'name': 'actionType',
                                    'type': 'select',
                                    'values': ['on', 'off', 'toggle']
                                },
                                {
                                    'name': 'deviceAddress',
                                    'type': 'text',
                                    'placeholder': 'like <192.168.0.50> or <https://192.168.0.50>',
                                    'autoStartWith': ['http://', 'https://'],
                                    'mustMatch': "^(https?:\\/\\/)?(\\d{1,3}\\.){3}\\d{1,3}$"
                                },
                                {
                                    'name': 'timerSeconds',
                                    'type': 'number',
                                    'min': 0
                                }
                            ],
                            'presets': {
                                'method': 'GET',
                                'restUrl': '${deviceAddress}/relay/0?turn=${actionType}&timer=${timerSeconds}',
                                'noCorsMode': true
                            }
                        }
                    ]
                },
                {
                    'id': 'Shelly_1PM_Gen1_HTTP_API',
                    'name': 'Shelly 1PM',
                    'actions': [
                        {
                            'name': 'TURN',
                            'actionModelName': 'GridActionHTTP',
                            'customValues': [
                                {
                                    'name': 'actionType',
                                    'type': 'select',
                                    'values': ['on', 'off', 'toggle']
                                },
                                {
                                    'name': 'deviceAddress',
                                    'type': 'text',
                                    'placeholder': 'like <192.168.0.50> or <https://192.168.0.50>',
                                    'autoStartWith': ['http://', 'https://'],
                                    'mustMatch': "^(https?:\\/\\/)?(\\d{1,3}\\.){3}\\d{1,3}$"
                                },
                                {
                                    'name': 'timerSeconds',
                                    'type': 'number',
                                    'min': 0
                                }
                            ],
                            'presets': {
                                'method': 'GET',
                                'restUrl': '${deviceAddress}/relay/0?turn=${actionType}&timer=${timerSeconds}',
                                'noCorsMode': true
                            }
                        }
                    ]
                },
                {
                    'id': 'Valetudo_Cleaning_Robot_API_v2',
                    'name': 'Valetudo Cleaning Robot',
                    'actions': [
                        {
                            'name': 'basicControl',
                            'actionModelName': 'GridActionHTTP',
                            'customValues': [
                                {
                                    'name': 'actionType',
                                    'type': 'select',
                                    'values': ['start', 'stop', 'pause', 'home']
                                },
                                {
                                    'name': 'deviceAddress',
                                    'type': 'text',
                                    'placeholder': 'like <192.168.0.50> or <https://192.168.0.50>',
                                    'autoStartWith': ['http://', 'https://'],
                                    'mustMatch': "^(https?:\\/\\/)?(\\d{1,3}\\.){3}\\d{1,3}$"
                                }
                            ],
                            'presets': {
                                'method': 'PUT',
                                'restUrl': '${deviceAddress}/api/v2/robot/capabilities/BasicControlCapability',
                                'body': '{"action": "${actionType}"}'
                            }
                        },
                        {
                            'name': 'manualControl',
                            'actionModelName': 'GridActionHTTP',
                            'customValues': [
                                {
                                    'name': 'actionType',
                                    'type': 'select',
                                    'values': [
                                        {'label': 'enableManualControl', 'value': '{"action":"enable"}'},
                                        {'label': 'moveForwards', 'value': '{"action":"move","movementCommand":"forward"}'},
                                        {'label': 'moveBackwards', 'value': '{"action":"move","movementCommand":"backward"}'},
                                        {'label': 'rotateClockwise', 'value': '{"action":"move","movementCommand":"rotate_clockwise"}'},
                                        {'label': 'rotateCounterclockwise', 'value': '{"action":"move","movementCommand":"rotate_counterclockwise"}'},
                                        {'label': 'disableManualControl', 'value': '{"action":"disable"}'},
                                    ]
                                },
                                {
                                    'name': 'deviceAddress',
                                    'type': 'text',
                                    'placeholder': 'like <192.168.0.50> or <https://192.168.0.50>',
                                    'autoStartWith': ['http://', 'https://'],
                                    'mustMatch': "^(https?:\\/\\/)?(\\d{1,3}\\.){3}\\d{1,3}$"
                                }
                            ],
                            'presets': {
                                'method': 'PUT',
                                'restUrl': '${deviceAddress}/api/v2/robot/capabilities/ManualControlCapability',
                                'body': '${actionType}'
                            }
                        },
                        {
                            'name': 'locateRobot',
                            'actionModelName': 'GridActionHTTP',
                            'customValues': [
                                {
                                    'name': 'deviceAddress',
                                    'type': 'text',
                                    'placeholder': 'like <192.168.0.50> or <https://192.168.0.50>',
                                    'autoStartWith': ['http://', 'https://'],
                                    'mustMatch': "^(https?:\\/\\/)?(\\d{1,3}\\.){3}\\d{1,3}$"
                                }
                            ],
                            'presets': {
                                'method': 'PUT',
                                'restUrl': '${deviceAddress}/api/v2/robot/capabilities/LocateCapability',
                                'body': '{"action":"locate"}'
                            }
                        }
                    ]
                }
            ]
        };
    },
    mounted() {
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