<template>
  <div>
    <div class="srow">
      <div class="four columns">
        <label class="normal-text" for="inputOpenHABUri">{{ $t('openHABUrl') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin">
          <input id="inputOpenHABUri" v-model="url" class="six columns" type="text" @change="fixOpenHABUrl()">
          <div class="six columns">
            <button style="width: 70%" @click="fetchItems()"><i class="fas fa-cloud-download-alt"/> <span>{{
                $t('fetchItems')
              }}</span></button>
            <span v-show="isFetched === undefined" class="spaced"><i class="fas fa-spinner fa-spin"/></span>
            <span v-show="isFetched" class="spaced" style="color: green"><i class="fas fa-check"/></span>
            <span v-show="isFetched === false" class="spaced" style="color: red"><i class="fas fa-times"/></span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isFetched === true">
      <div class="srow">
        <div class="four columns">
          <label class="normal-text" for="selectType">{{ $t('filterItem') }}</label>
        </div>
        <div class="eight columns">
          <div class="d-inline">
            <input id="All" v-model="typeItem" class="custom-radio" type="radio" value="All" @change="getFirstItem(typeItem)">
            <label class="button normal-text" for="All">{{ $t('All') }}</label>
          </div>
          <div v-for="type in OPENHAB_TYPES" class="d-inline">
            <input :id="getKeyName(type)" v-model="typeItem" :value="getKeyName(type)" class="custom-radio"
                   type="radio" @change="getFirstItem(typeItem)">
            <label :for="getKeyName(type)" class="button normal-text">{{
                $t(getKeyName(type))
              }}</label>
          </div>
        </div>
      </div>
      <div class="srow">
        <div class="four columns">
          <label class="normal-text" for="searchItems">{{ $t('searchItem') }}</label>
        </div>
        <div class="eight columns">
          <input id="searchItems" v-model="searchText" :placeholder="$t('placeholder-searchItem')" spellcheck="false"
                 type="text">
          <button style="height: unset; padding: 0 5px !important;
    line-height: unset;" @click="searchText = ''" :title="$t('DeleteSearchText')"><i class="fas fa-trash"/></button>
        </div>
      </div>
      <div class="srow">
        <div class="four columns">
          <label class="normal-text" for="selectItem">{{ $t('selectItem') }}</label>
        </div>
        <div class="eight columns">
          <div class="srow">
            <select class="twelve columns" v-if="typeItem === 'All'" id="selectItem" v-model="action.itemName"
                    @change="(event)=>{getItemType(event);this.action.actionType = this.OPENHAB_TYPES[this.action.itemType][0]}">
              <option v-for="item in filteredItems" :id="item.type">{{ item.name }}</option>
            </select>
            <select class="twelve" v-else id="selectItem" v-model="action.itemName" @change="updateType()">
              <option v-for="item in filteredItems" v-if="item.type === typeItem">{{ item.name }}</option>
            </select>
          </div>

        </div>
      </div>
    </div>
    <div v-else-if="fetchedItems !== true && action.itemName">
      <div class="srow">
        <div class="four columns">
          <label :for="action.itemName" class="normal-text">{{ $t('selectedItem') }}</label>
        </div>
        <div :id="action.itemName" class="eight columns">
          {{ action.itemName }}
        </div>
      </div>
    </div>
    <div v-if="isFetched === true || action.itemName">
      <div class="srow">
        <div class="four columns">
          <label class="normal-text" for="selectAction">{{ $t('selectAction') }}</label>
        </div>
        <div class="eight columns">
          <select id="selectAction" v-model="action.actionType" @change="action.actionValue = '0'">
            <option v-for="action in OPENHAB_TYPES[action.itemType]" :value="action">
              {{ $t(`openHAB.${action}`) }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="action.actionType === 'CUSTOM_VALUE' || action.actionType === 'CUSTOM_COLOR'">
      <div class="srow">
        <div class="four columns">
          <label v-if="action.itemType === 'Number:Temperature'" class="normal-text"
                 for="customTemperature">{{ $t('customTemperature') }}</label>
          <label
              v-if="(action.itemType === 'Rollershutter' || action.itemType === 'Dimmer' || action.itemType === 'Color') && action.actionType === 'CUSTOM_VALUE'"
              class="normal-text" for="customValue">{{ $t('customValue') }}</label>
          <label v-if="action.itemType === 'Color' && action.actionType === 'CUSTOM_COLOR'" class="normal-text"
                 for="customColor">{{ $t('customColor') }}</label>
        </div>
        <div class="eight columns">
          <input v-if="action.itemType === 'Number:Temperature'" id="customTemperature" v-model="action.actionValue"
                 max="100" min="0"
                 type="number">
          <div
              v-if="(action.itemType === 'Rollershutter' || action.itemType === 'Dimmer' || action.itemType === 'Color') && action.actionType === 'CUSTOM_VALUE'">
            <div class="srow">
              <div class="one columns">
                <span>{{ action.actionValue }}</span>
              </div>
              <div class="eleven columns">
                <input id="customValue" v-model="action.actionValue" class="eleven columns" max="100" min="0"
                       style="width: 100%; cursor:pointer;" type="range">
              </div>
            </div>
          </div>
          <input v-if="action.itemType === 'Color' && action.actionType === 'CUSTOM_COLOR'" id="customColor"
                 v-model="action.actionValue" max="254" type="color">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {openHABService} from "../../../js/service/openHABService";

export default {
  props: ['action'],
  data: () => {
    return {
      fetchedItems: null,
      url: '',
      typeItem: 'All',
      isFetched: null,
      searchText: '',
      OPENHAB_TYPES: {
        "Switch": ["ON", "OFF"],
        "Dimmer": ["ON", "OFF", "INCREASE", "DECREASE", "CUSTOM_VALUE"],
        "Rollershutter": ["UP", "DOWN", "STOP", "CUSTOM_VALUE"],
        "Color": ["ON", "OFF", "INCREASE", "DECREASE", "CUSTOM_VALUE", "CUSTOM_COLOR"],
        "Number:Temperature": ["CUSTOM_VALUE"],
        "Player": ["PLAY", "PAUSE", "NEXT", "PREVIOUS", "REWIND", "FASTFORWARD"]
      },
      filteredItemTypes: ["Switch", "Dimmer", "Rollershutter", "Color", "Number:Temperature", "Player"]
    }
  },
  methods: {
    fetchItems() {
      this.isFetched = undefined;

      openHABService.fetchItems(this.action.openHABUrl).then((data) => {
        this.isFetched = true;
        let newItems = data.filter(e => this.filteredItemTypes.includes(e.type));
        if (!this.checkForNew(this.fetchedItems, newItems)) {
          this.fetchedItems = newItems;
          this.setFirstItem();
        }
        console.debug(this.fetchedItems)
      }).catch((error) => {
        this.isFetched = false;
        console.error(error);
      });
    },
    fixOpenHABUrl() {
      this.url = openHABService.getRestURL(this.url);
      this.updateUrl();
    },
    updateUrl() {
      this.action.openHABUrl = this.url;
    },
    updateType() {
      this.action.itemType = this.typeItem;
    },
    getKeyName(value) {
      return Object.keys(this.OPENHAB_TYPES).find(key => this.OPENHAB_TYPES[key] === value);
    },
    getItemType(event) {
      let options = event.target.options;
      if (options.selectedIndex > -1) {
        this.action.itemType = options[options.selectedIndex].getAttribute('id');
      }
    },
    setFirstItem() {
      this.action.itemName = this.fetchedItems[0].name;
      this.action.itemType = this.fetchedItems[0].type;
      this.action.actionType = this.OPENHAB_TYPES[this.action.itemType][0]
      this.searchText = '';
    },
    checkForNew(oldItems, newItems) {
      return JSON.stringify(newItems) === JSON.stringify(oldItems);
    },
    getFirstItem(newItem) {
      if (newItem !== 'All') {
        let firstItem = this.fetchedItems.find(item => item.type === newItem);
        if (firstItem !== undefined) {
          this.action.itemType = newItem;
          this.action.itemName = firstItem.name;
          this.action.actionType = this.OPENHAB_TYPES[newItem][0];
          this.searchText = '';
        }
      } else {
        this.setFirstItem();
      }
    }
  },
  computed: {
    filteredItems() {
      // For the next action version
      /*let filtered = this.fetchedItems.filter((item) => {
        return item.name.toLowerCase().match((this.searchText.toLowerCase()))
      });
      filtered = filtered.filter(e => this.typeItem === "All" || e.type === this.typeItem);
      return filtered;*/
      return this.fetchedItems.filter((item) => {
        return item.name.toLowerCase().match((this.searchText.toLowerCase()))
      });
    }
  },
  mounted() {
    this.url = this.action.openHABUrl || openHABService.getRestURL();
    this.updateUrl();
    this.typeItem = this.action.itemType || 'All';
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
  margin: 0.5em 0.5em 0.5em 0;
  text-transform: none;
  box-shadow: none;
  background-color: white;
  border: 1px solid #bbbbbb;
  border-radius: 5px;
}

.button:hover {
  background-color: #cceff9;
  cursor: pointer;
}

</style>