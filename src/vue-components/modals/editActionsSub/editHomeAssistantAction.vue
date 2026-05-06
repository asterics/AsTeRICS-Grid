<template>
    <div class="container-fluid px-0">
        <div class="row">
            <div class="col-12 col-md-4">
                <label class="normal-text" for="inputHomeAssistantUri">{{ $t('homeAssistantUrl') }}</label>
            </div>
            <div class="col-12 col-md-4 mb-2">
                <input class="col-12" id="inputHomeAssistantUri" 
                       v-model="action.homeAssistantUrl" 
                       type="text"
                       placeholder="http://192.168.0.230:8123">
                </input>  
            </div>
            <div class="col-12 col-md-4">
                <div class="row mb-0">
                    <div class="col-10">
                        <button class="col-12" @click="fetchItems()"><i class="fas fa-cloud-download-alt"/>
                            <span>{{ $t('fetchItems') }}</span></button>
                    </div>
                    <span v-show="fetchSuccessful === undefined" class="col"><i class="fas fa-spinner fa-spin"/></span>
                    <span v-show="fetchSuccessful" class="col" style="color: green"><i class="fas fa-check"/></span>
                    <span v-show="fetchSuccessful === false" class="col" style="color: red"><i
                        class="fas fa-times"/></span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 col-md-4">
                <label class="normal-text" for="inputBearerToken">Bearer Token</label>
            </div>
            <div class="col-12 col-md-8 mb-2">
                <input class="col-12" id="inputBearerToken" v-model="action.token" type="password"
                       @change="saveBearerTokenToStorage()"
                       placeholder="Geben Sie hier Ihren Bearer Token ein">
            </div>
        </div>
        <div v-if="fetchSuccessful">
            <fieldset role="radiogroup" class="p-0 row" style="border: none;">
                <legend class="col-12 col-md-4 d-inline" style="float: left">{{ $t('filterByType') }}</legend>
                <div class="col-12 col-md-8">
                    <div v-for="type in Object.values(HOMEASSISTANT_ITEM_TYPES)" class="d-inline">
                        <input :id="type" v-model="selectedTypeFilter" :value="type" class="custom-radio" type="radio"
                               @change="setFirstItem()">
                        <label :for="type" class="button mr-3 mb-2 normal-text">{{ $t(type) }}</label>
                    </div>
                </div>
            </fieldset>
            <div class="row">
                <label class="col-12 col-md-4 normal-text" for="searchItems">{{ $t('searchItem') }}</label>
                <div class="col-9 col-md-4">
                    <input class="col-12" id="searchItems" v-model="searchText" @input="setFirstItem()"
                           :placeholder="$t('placeholder-searchItem')" spellcheck="false" autocomplete="true"
                           type="text">
                </div>
                <div class="col-3">
                    <button class="py-0 px-3 mb-0" @click="searchText = ''; setFirstItem();"
                            :title="$t('clearSearchText')"><i class="fas fa-trash"/></button>
                </div>
            </div>
            <div v-if="filteredItems.length > 0">
                <div class="row">
                    <div class="col-12 col-md-4">
                        <label class="normal-text" for="selectItem">{{ $t('selectItem') }}</label>
                    </div>
                    <div class="col-12 col-md-4">
                        <select class="col-12" id="selectItem" v-model="selectedItem" @change="updateAction()">
                            <option v-for="item in filteredItems" :value="item">{{ $t(item.type) }}: {{ item.name }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="fetchSuccessful && filteredItems.length === 0">
            <span class="col-12 col-md-6 offset-md-4">(no items)</span>
        </div>
        <div v-if="!fetchSuccessful && action.itemName">
            <div class="row">
                <div class="col-12 col-md-4">
                    <label :for="action.itemName" class="normal-text">{{ $t('selectedItem') }}</label>
                </div>
                <div :id="action.itemName" class="col-12 col-md-8">
                    {{ $t(action.itemType) }}: {{ action.itemName }}
                </div>
            </div>
        </div>
        <div v-if="(fetchSuccessful && filteredItems.length > 0) || action.itemName">
            <div class="row">
                <div class="col-12 col-md-4">
                    <label class="normal-text" for="selectAction">{{ $t('selectAction') }}</label>
                </div>
                <div class="col-12 col-md-4 mb-2">
                    <select id="selectAction" class="col-12" v-model="action.actionType"
                            @change="action.actionValue = '0'">
                        <option v-for="ohAction in HOMEASSISTANT_TYPES_TO_ACTIONS[action.itemType]" :value="ohAction">
                            {{ $t(`homeAssistant.${ohAction}`) }}
                        </option>
                    </select>
                </div>
                <div class="col-12 col-md-4">
                    <div class="row">
                        <div class="col-6">
                            <button class="col-12" @click="addAllActionElements"><i class="fas fa-plus"/> Alle</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'BRIGHTNESS'">
            <label class="col-12 col-md-4 normal-text" for="brightness">{{ $t('brightness') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="brightness" v-model="action.actionValue" class="col-12" max="100" min="0" type="range">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'BRIGHTNESS_STEP'">
            <label class="col-12 col-md-4 normal-text" for="brightnessStep">{{ $t('brightnessStep') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="brightnessStep" v-model="action.actionValue" class="col-12" max="100" min="-100" type="range">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'COLOR'">
            <label class="col-12 col-md-4 normal-text" for="color">{{ $t('color') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="color" v-model="action.actionValue" class="col-12" type="color">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'SET_TEMPERATURE'">
            <label class="col-12 col-md-4 normal-text" for="temperatureSet">{{ $t('temperatureSet') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="temperatureSet" v-model.number="action.actionValue" class="col-12" max="35" min="5" type="range" value="19">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'SET_POSITION'">
            <label class="col-12 col-md-4 normal-text" for="positionSet">{{ $t('positionSet') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="positionSet" v-model="action.actionValue" class="col-12" max="100" min="0" type="range">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'CUSTOM_VALUE'">
            <label class="col-12 col-md-4 normal-text" for="customValue">{{ $t('customValue') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="customValue" v-model="action.actionValue" class="col-12" max="100" min="0" type="range">
                    </div>
                    <div class="col-2 col-sm-1">
                        <span>{{ action.actionValue }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'CUSTOM_COLOR'">
            <label class="col-12 col-md-4 normal-text" for="customColor">{{ $t('customColor') }}</label>
            <div class="col-12 col-md-8">
                <input id="customColor" v-model="action.actionValue" type="color">
            </div>
        </div>
    </div>
</template>

<script>
import {homeAssistantService} from "../../../js/service/homeAssistantService";
import {i18nService} from "../../../js/service/i18nService.js";
import {GridData} from "../../../js/model/GridData.js";
import {arasaacService} from "../../../js/service/pictograms/arasaacService.js";

const HOMEASSISTANT_ITEM_TYPES = {
    "ALL": "All",
    "SWITCH": "Switch",
    "LIGHT": "Light",
    "COVER": "Cover",
    "CLIMATE": "Climate",
    "MEDIA_PLAYER": "Media-Player",
    "REMOTE": "Remote",
    "LOCK": "Lock"
}

const HOMEASSISTANT_TYPES_TO_ACTIONS = {};
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.SWITCH] = ["ON", "OFF", "TOGGLE"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.LIGHT] = ["ON", "OFF", "TOGGLE", "BRIGHTNESS", "BRIGHTNESS_STEP", "COLOR"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.COVER] = ["OPEN", "CLOSE", "STOP", "TOGGLE", "SET_POSITION"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.CLIMATE] = ["ON", "OFF", "SET_TEMPERATURE"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.MEDIA_PLAYER] = ["ON", "OFF", "TOGGLE", "VOLUME_UP", "VOLUME_DOWN", "VOLUME_MUTE", "VOLUME_UNMUTE", "PLAY", "PAUSE", "NEXT", "PREVIOUS"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.REMOTE] = ["ON", "OFF", "TOGGLE"];
HOMEASSISTANT_TYPES_TO_ACTIONS[HOMEASSISTANT_ITEM_TYPES.LOCK] = ["LOCK", "UNLOCK", "TOGGLE"]

const ACTIONS_FOR_ELEMENT_GENERATION = ["ON", "OFF", "TOGGLE", "INCREASE", "DECREASE", "OPEN", "CLOSE", "STOP", "PLAY", "PAUSE", "NEXT",
"PREVIOUS", "VOLUME_UP", "VOLUME_DOWN", "VOLUME_MUTE", "VOLUME_UNMUTE", "CUSTOM_VALUE", "BRIGHTNESS", "BRIGHTNESS_STEP", "COLOR", "SET_TEMPERATURE", "SET_POSITION", "LOCK", "UNLOCK"];
const MAP_ACTION_TO_IMAGE = {};
MAP_ACTION_TO_IMAGE["ON"] = arasaacService.getGridImageById(21818);
MAP_ACTION_TO_IMAGE["OFF"] = arasaacService.getGridImageById(21365);
MAP_ACTION_TO_IMAGE["TOGGLE"] = arasaacService.getGridImageById(38753);
MAP_ACTION_TO_IMAGE["VOLUME_UP"] = arasaacService.getGridImageById(6218);
MAP_ACTION_TO_IMAGE["VOLUME_DOWN"] = arasaacService.getGridImageById(5916);
MAP_ACTION_TO_IMAGE["VOLUME_MUTE"] = arasaacService.getGridImageById(38214);
MAP_ACTION_TO_IMAGE["VOLUME_UNMUTE"] = arasaacService.getGridImageById(38216);
MAP_ACTION_TO_IMAGE["OPEN"] = arasaacService.getGridImageById(38755);
MAP_ACTION_TO_IMAGE["CLOSE"] = arasaacService.getGridImageById(38754);
MAP_ACTION_TO_IMAGE["SET_POSITION"] = arasaacService.getGridImageById(2518);
MAP_ACTION_TO_IMAGE["STOP"] = arasaacService.getGridImageById(38251);
MAP_ACTION_TO_IMAGE["PLAY"] = arasaacService.getGridImageById(38221);
MAP_ACTION_TO_IMAGE["PAUSE"] = arasaacService.getGridImageById(38213);
MAP_ACTION_TO_IMAGE["NEXT"] = arasaacService.getGridImageById(38223);
MAP_ACTION_TO_IMAGE["PREVIOUS"] = arasaacService.getGridImageById(38224);
MAP_ACTION_TO_IMAGE["BRIGHTNESS"] = arasaacService.getGridImageById(2285);
MAP_ACTION_TO_IMAGE["BRIGHTNESS_STEP"] = arasaacService.getGridImageById(2285);
MAP_ACTION_TO_IMAGE["SET_TEMPERATURE"] = arasaacService.getGridImageById(34898);
MAP_ACTION_TO_IMAGE["COLOR"] = arasaacService.getGridImageById(34868);
MAP_ACTION_TO_IMAGE["LOCK"] = arasaacService.getGridImageById(24022);
MAP_ACTION_TO_IMAGE["UNLOCK"] = arasaacService.getGridImageById(24598);

export default {
    props: ['action', 'gridData', 'position'],  // Position hinzufügen
    data: () => {
        return {
            fetchedItems: [],
            selectedItem: null,
            selectedTypeFilter: HOMEASSISTANT_ITEM_TYPES.ALL,
            fetchSuccessful: null,
            searchText: '',
            HOMEASSISTANT_ITEM_TYPES: HOMEASSISTANT_ITEM_TYPES,
            HOMEASSISTANT_TYPES_TO_ACTIONS: HOMEASSISTANT_TYPES_TO_ACTIONS
        }
    },
    computed: {
        filteredItems() {
            this.fetchedItems;
            this.selectedTypeFilter;
            return this.getFilteredItems();
        }
    },
    watch: {
        'action.actionValue': function(newValue) {
            if (this.action.actionType === 'BRIGHTNESS') {
                this.action.serviceData = { brightness: Math.round((parseInt(this.action.actionValue) / 100) * 255) || 0 };
            } else if (this.action.actionType === 'BRIGHTNESS_STEP') {
                this.action.serviceData = { brightness_step: Math.round((parseInt(this.action.actionValue) /100) *255) || 0};
            } else if (this.action.actionType === 'SET_TEMPERATURE') {
                this.action.serviceData = { temperature: parseInt(this.action.actionValue) || 0};
            } else if (this.action.actionType === 'SET_POSITION') {
                this.action.serviceData = { position: parseInt(this.action.actionValue) || 0};
            } else if (this.action.actionType === 'COLOR') {
                this.action.serviceData = { rgb_color: hexToRGB(this.action.actionValue) || 0};
            } else {
                this.action.serviceData = {};
            }
        },
        'action.actionType': function(newValue) {
            if (this.action.actionType === 'VOLUME_MUTE') {
                this.action.serviceData = { is_volume_muted: true}
            } else if (this.action.actionType === 'VOLUME_UNMUTE') {
                this.action.serviceData = { is_volume_muted: false}
            } else {
                this.action.serviceData = {}
            }
        }
    },
    methods: {
        fetchItems() {
            this.fetchSuccessful = undefined;
            homeAssistantService.fetchEntities(this.action.homeAssistantUrl, this.action.token).then((data) => {
                this.fetchSuccessful = true;
                console.log('DEBUG fetchItems - Raw data length:', data.length, 'Data:', data);  // DEBUG: Anzahl der geladenen Items
                // Map HA states to item objects { name, type, attributes, state }
                const newItems = data.map(e => {
                    const entityId = e.entity_id || e.entityId || e.entityId;
                    const domain = (entityId || '').split('.')[0] || '';
                    const type = HOMEASSISTANT_ITEM_TYPES[domain.toUpperCase()] || HOMEASSISTANT_ITEM_TYPES.ALL;
                    return { name: entityId, type: type, attributes: e.attributes || {}, state: e.state };
                });
                this.fetchedItems = newItems;
                this.selectedTypeFilter = HOMEASSISTANT_ITEM_TYPES.ALL;  // Erzwinge Filter auf ALL, um alle Items anzuzeigen
                console.log('DEBUG fetchItems - Mapped items length:', newItems.length, 'Selected filter:', this.selectedTypeFilter);  // DEBUG: Nach Mapping und Filter
            }).catch((error) => {
                this.fetchSuccessful = false;
                console.error('Error fetching items:', error);
            });
        },
        saveBearerTokenToStorage() {
            if (this.action.token) {
                localStorage.setItem('homeAssistantBearerToken', this.action.token);
            } else {
                localStorage.removeItem('homeAssistantBearerToken');
            }
        },
        loadBearerTokenFromStorage() {
            const savedToken = localStorage.getItem('homeAssistantBearerToken');
            if (savedToken && !this.action.token) {
                this.action.token = savedToken;
            }
        },
        getFilteredItems() {
            const txt = (this.searchText || '').toLowerCase();
            let filtered = this.fetchedItems.filter((item) => {
                return !txt || (item.name || '').toLowerCase().indexOf(txt) !== -1;
            });
            filtered = filtered.filter(e => this.selectedTypeFilter === HOMEASSISTANT_ITEM_TYPES.ALL || e.type === this.selectedTypeFilter);
            return filtered;
        },
        fixHomeAssistantUrl() {
            this.action.homeAssistantUrl = homeAssistantService.getRestURL(this.action.homeAssistantUrl);
        },
        updateAction() {
            let item = this.selectedItem || {};
            this.action.itemName = item.name;
            this.action.itemType = item.type;
            this.action.actionType = this.action.itemType ? HOMEASSISTANT_TYPES_TO_ACTIONS[this.action.itemType][0] : null;
        },
        setFirstItem() {
            let filteredItems = this.getFilteredItems();
            this.selectedItem = filteredItems[0];
            this.updateAction();
        },
//        addSingleActionElement() {
//            let actionCopy = JSON.parse(JSON.stringify(this.action));
//            // Nutze das ausgewählte action.actionType, nicht das erste aus der Liste
//            let selectedAction = this.action.actionType;
//            if (!selectedAction || !ACTIONS_FOR_ELEMENT_GENERATION.includes(selectedAction)) {
//                alert('Keine gültige Aktion ausgewählt!');
//                return;
//            }
//            let newElement = new GridData(this.gridData).getNewGridElement({
//                label: i18nService.getTranslationObject(selectedAction),  // z.B. "ON"
//                actions: [actionCopy],
//                image: MAP_ACTION_TO_IMAGE[selectedAction]  // Passendes Bild/Icon
//            });
//            this.gridData.gridElements.push(newElement);
//        },
        addAllActionElements() {
            let allActions = HOMEASSISTANT_TYPES_TO_ACTIONS[this.action.itemType] || [];
            let createActions = allActions.filter(action => ACTIONS_FOR_ELEMENT_GENERATION.includes(action));
            if (!confirm(i18nService.t('thisActionAddsXNewElements', createActions.length))) {
                return;
            }
            this.gridData.rowCount++;
            for (let ohAction of createActions) {
                let actionCopy = JSON.parse(JSON.stringify(this.action));
                actionCopy.actionType = ohAction;
                let newElement = new GridData(this.gridData).getNewGridElement({
                    label: i18nService.getTranslationObject(`${this.action.itemName} - ${i18nService.t(`homeAssistant.${ohAction}`)}`),
                    actions: [actionCopy],
                    image: MAP_ACTION_TO_IMAGE[ohAction]
                });
                this.gridData.gridElements.push(newElement);
            }
        },
    },
    mounted() {
        this.action.homeAssistantUrl = this.action.homeAssistantUrl || 'http://192.168.0.230:8123';
        this.loadBearerTokenFromStorage();
        //this.fetchItems();
    }
}
function hexToRGB(hex) {
    const bigint = parseInt(hex.replace('#',''), 16);
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ];
}
</script>

<style scoped>

.normal-text {
    font-weight: normal;
}

.custom-radio {
    opacity: 0;
    z-index: -1;
    position: absolute;
}

.custom-radio:checked ~ label {
    border-width: 0.2em;
    border-color: #33C3F0;
    background-color: #cceff9;
}

.button {
    display: inline-block;
    padding: 0 5px !important;
    line-height: unset;
    width: unset;
    text-transform: none;
    box-shadow: none;
    background-color: white;
    border: 1px solid #bbbbbb;
    border-radius: 5px;
}

button {
    line-height: unset;
}

.button:hover {
    background-color: #cceff9;
    cursor: pointer;
}

.row {
    margin-bottom: 1em;
}

</style>