<template>
    <div class="container-fluid px-0">
        <div class="row">
            <div class="col-12 col-md-4">
                <label class="normal-text" for="inputOpenHABUri">{{ $t('openHABUrl') }}</label>
            </div>
            <div class="col-12 col-md-4 mb-2">
                <input class="col-12" id="inputOpenHABUri" v-model="action.openHABUrl" type="text"
                       @change="fixOpenHABUrl()">
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
        <div v-if="fetchSuccessful">
            <fieldset role="radiogroup" class="p-0 row" style="border: none;">
                <legend class="col-12 col-md-4 d-inline" style="float: left">{{ $t('filterByType') }}</legend>
                <div class="col-12 col-md-8">
                    <div v-for="type in Object.values(OPENHAB_ITEM_TYPES)" class="d-inline">
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
                           :placeholder="$t('placeholder-searchItem')" spellcheck="false" autocomplete="false"
                           type="text">
                </div>
                <div class="col-3">
                    <button class="py-0 px-3 mb-0" @click="searchText = ''; setFirstItem();"
                            :title="$t('DeleteSearchText')"><i
                        class="fas fa-trash"/></button>
                </div>
            </div>
            <div v-if="filteredItems.length > 0">
                <div class="row">
                    <div class="col-12 col-md-4">
                        <label class="normal-text" for="selectItem">{{ $t('selectItem') }}</label>
                    </div>
                    <div class="col-12 col-md-4">
                        <select class="col-12" id="selectItem" v-model="selectedItem" @change="updateAction()">
                            <option v-for="item in filteredItems" :value="item">{{ $t(item.type) }}: {{
                                    item.name
                                }}
                            </option>
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
                <div class="col-12 col-md-4">
                    <select id="selectAction" class="col-12" v-model="action.actionType"
                            @change="action.actionValue = '0'">
                        <option v-for="action in OPENHAB_TYPES_TO_ACTIONS[action.itemType]" :value="action">
                            {{ $t(`openHAB.${action}`) }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="row" v-if="action.actionType === 'CUSTOM_VALUE'">
            <label class="col-12 col-md-4 normal-text" for="customValue">{{ $t('customValue') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="customValue" v-model="action.actionValue" class="col-12" max="100" min="0"
                               type="range">
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
import {openHABService} from "../../../js/service/openHABService";

const OPENHAB_ITEM_TYPES = {
    "ALL": "All",
    "SWITCH": "Switch",
    "DIMMER": "Dimmer",
    "ROLLERSHUTTER": "Rollershutter",
    "COLOR": "Color",
    "NUMBER": "Number",
    "PLAYER": "Player",
    "TEMPERATURE": "Number:Temperature"
}

const OPENHAB_TYPES_TO_ACTIONS = {};
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.SWITCH] = ["ON", "OFF", "TOGGLE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.DIMMER] = ["ON", "OFF", "INCREASE", "DECREASE", "CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.ROLLERSHUTTER] = ["UP", "DOWN", "STOP", "CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.COLOR] = ["ON", "OFF", "CUSTOM_VALUE", "CUSTOM_COLOR"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.NUMBER] = ["CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.TEMPERATURE] = ["CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.PLAYER] = ["PLAY", "PAUSE", "NEXT", "PREVIOUS", "REWIND", "FASTFORWARD"];

export default {
    props: ['action'],
    data: () => {
        return {
            fetchedItems: [],
            selectedItem: null,
            selectedTypeFilter: OPENHAB_ITEM_TYPES.ALL,
            fetchSuccessful: null,
            searchText: '',
            OPENHAB_ITEM_TYPES: OPENHAB_ITEM_TYPES,
            OPENHAB_TYPES_TO_ACTIONS: OPENHAB_TYPES_TO_ACTIONS
        }
    },
    computed: {
        filteredItems() {
            this.fetchedItems;
            this.selectedTypeFilter;
            return this.getFilteredItems();
        }
    },
    methods: {
        fetchItems() {
            this.fetchSuccessful = undefined;
            openHABService.fetchItems(this.action.openHABUrl).then((data) => {
                this.fetchSuccessful = true;
                let newItems = data.filter(e => Object.values(OPENHAB_ITEM_TYPES).some(type => type.startsWith(e.type)));
                newItems.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
                if (JSON.stringify(this.fetchedItems) !== JSON.stringify(newItems)) {
                    this.fetchedItems = newItems;
                    this.setFirstItem();
                }
            }).catch((error) => {
                this.fetchSuccessful = false;
                console.error(error);
            });
        },
        getFilteredItems() {
            let filtered = this.fetchedItems.filter((item) => {
                return item.name.toLowerCase().match((this.searchText.toLowerCase()))
            });
            filtered = filtered.filter(e => this.selectedTypeFilter === OPENHAB_ITEM_TYPES.ALL || e.type === this.selectedTypeFilter);
            return filtered;
        },
        fixOpenHABUrl() {
            this.action.openHABUrl = openHABService.getRestURL(this.action.openHABUrl);
        },
        updateAction() {
            let item = this.selectedItem || {};
            this.action.itemName = item.name;
            this.action.itemType = item.type;
            this.action.actionType = this.action.itemType ? OPENHAB_TYPES_TO_ACTIONS[this.action.itemType][0] : null;
        },
        setFirstItem() {
            let filteredItems = this.getFilteredItems();
            this.selectedItem = filteredItems[0];
            this.updateAction();
        }
    },
    mounted() {
        this.action.openHABUrl = this.action.openHABUrl || openHABService.getRestURL();
        this.selectedTypeFilter = this.action.itemType || 'All';
    }
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