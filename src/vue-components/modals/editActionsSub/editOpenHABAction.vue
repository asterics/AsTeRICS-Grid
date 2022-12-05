<template>
  <div>
    <div class="srow">
      <div class="four columns">
        <label for="inputOpenHABUri" class="normal-text">{{ $t('openHABUrl') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin">
          <input id="inputOpenHABUri" class="six columns" type="text" v-model="url" @change="fixOpenHABUrl()">
          <div class="six columns">
            <button style="width: 70%" @click="fetchItems()"><i class="fas fa-bolt"/> <span>{{
                $t('fetchItems')
              }}</span></button>
            <span class="spaced" v-show="isFetched === undefined"><i class="fas fa-spinner fa-spin"/></span>
            <span class="spaced" v-show="isFetched" style="color: green"><i class="fas fa-check"/></span>
            <span class="spaced" v-show="isFetched === false" style="color: red"><i class="fas fa-times"/></span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isFetched === true">
      <div class="srow">
        <div class="four columns">
          <label for="selectType" class="normal-text">{{ $t('filterItem') }}</label>
        </div>
        <div class="eight columns">
          <div class="d-inline">
            <input type="radio" id="All" value="All" class="custom-radio" v-model="typeItem">
            <label for="All" class="button normal-text">{{ $t('All') }}</label>
          </div>
          <div class="d-inline" v-for="type in OPENHAB_TYPES">
            <input type="radio" v-model="typeItem" :id="getKeyName(type)" :value="getKeyName(type)"
                   class="custom-radio">
            <label :for="getKeyName(type)" class="button normal-text">{{
                $t(getKeyName(type))
              }}</label>
          </div>
        </div>
      </div>
      <div class="srow">
        <div class="four columns">
          <label for="selectItem" class="normal-text">{{ $t('selectItem') }}</label>
        </div>
        <div class="eight columns">
          <select id="selectItem" v-model="action.itemName" v-if="typeItem === 'All'" @change="getItemType($event)">
            <option v-for="item in fetchedItems" :id="item.type">{{ item.name }}</option>
          </select>
          <select id="selectItem" v-model="action.itemName" @change="updateType()" v-else>
            <option v-for="item in fetchedItems" v-if="item.type === typeItem">{{ item.name }}</option>
          </select>
        </div>
      </div>
    </div>
    <div v-else-if="fetchedItems !== true && action.itemName">
      <div class="srow">
        <div class="four columns">
          <label :for="action.itemName" class="normal-text">{{ $t('selectedItem') }}</label>
        </div>
        <div class="eight columns" :id="action.itemName">
          {{ action.itemName }}
        </div>
      </div>
    </div>
    <div v-if="isFetched === true || action.itemName">
      <div class="srow">
        <div class="four columns">
          <label for="selectAction" class="normal-text">{{ $t('selectAction') }}</label>
        </div>
        <div class="eight columns">
          <select id="selectAction" v-model="action.actionType" @change="action.actionValue = '0'">
            <option v-for="action in OPENHAB_TYPES[action.itemType]" :value="action">
              {{ $t(action) }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="action.actionType === 'CUSTOM_VALUE' || action.actionType === 'CUSTOM_COLOR'">
      <div class="srow">
        <div class="four columns">
          <label v-if="action.itemType === 'Number:Temperature'" for="customTemperature"
                 class="normal-text">{{ $t('customTemperature') }}</label>
          <label
              v-if="(action.itemType === 'Rollershutter' || action.itemType === 'Dimmer' || action.itemType === 'Color') && action.actionType === 'CUSTOM_VALUE'"
              for="customValue" class="normal-text">{{ $t('customValue') }}</label>
          <label v-if="action.itemType === 'Color' && action.actionType === 'CUSTOM_COLOR'" for="customColor"
                 class="normal-text">{{ $t('customColor') }}</label>
        </div>
        <div class="eight columns">
          <input id="customTemperature" v-if="action.itemType === 'Number:Temperature'" type="number" min="0" max="100"
                 v-model="action.actionValue">
          <div
              v-if="(action.itemType === 'Rollershutter' || action.itemType === 'Dimmer' || action.itemType === 'Color') && action.actionType === 'CUSTOM_VALUE'">
            <div class="srow">
              <div class="one columns">
                <span>{{ action.actionValue }}</span>
              </div>
              <div class="eleven columns">
                <input class="eleven columns" style="width: 100%; cursor:pointer;" id="customValue" type="range" min="0"
                       max="100" v-model="action.actionValue">
              </div>
            </div>
          </div>
          <input id="customColor" v-if="action.itemType === 'Color' && action.actionType === 'CUSTOM_COLOR'"
                 type="color" v-model="action.actionValue" max="254">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {openHABService} from "../../../js/service/openHABService";
import {util} from "../../../js/util/util";

export default {
  props: ['action'],
  data: () => {
    return {
      fetchedItems: null,
      url: '',
      typeItem: 'All',
      isFetched: null,
      OPENHAB_TYPES: {
        "Switch": ["ON", "OFF"],
        "Dimmer": ["ON", "OFF", "INCREASE", "DECREASE", "CUSTOM_VALUE"],
        "Rollershutter": ["UP", "DOWN", "STOP", "CUSTOM_VALUE"],
        "Color": ["ON", "OFF", "INCREASE", "DECREASE", "CUSTOM_VALUE", "CUSTOM_COLOR"],
        "Number:Temperature": ["CUSTOM_VALUE"]
      },
      filteredItemTypes: ["String", "Group", "DateTime", "Location", "Image", "Contact"]
    }
  },
  watch: {
    typeItem(newItem, oldItem) {
      console.log(newItem, oldItem)
      if (newItem !== 'All') {
        this.action.itemType = newItem;
        this.action.itemName = this.fetchedItems.find(item => item.type === newItem).name;
        this.action.actionType = this.OPENHAB_TYPES[newItem][0];
      } else {
        this.setFirstItem();
      }
    }
  },
  methods: {
    fetchItems() {
      this.isFetched = undefined;

      openHABService.fetchItems(this.action.openHABUrl).then((data) => {
        this.isFetched = true;
        this.fetchedItems = data.filter(e => !this.filteredItemTypes.includes(e.type));
        this.setFirstItem();
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
    setFirstItem(){
      this.action.itemName = this.fetchedItems[0].name;
      this.action.itemType = this.fetchedItems[0].type;
      this.action.actionType = this.OPENHAB_TYPES[this.action.itemType][0]
    }
  },
  mounted() {
    log.warn(this.action);
    this.url = this.action.openHABUrl || openHABService.getRestURL();
    this.typeItem = this.action.itemType || 'All';
    //this.$set(this.action ,"itemType", this.action.itemType || 'All');
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
}

.button:hover {
  background-color: #cceff9;
  cursor: pointer;
}

</style>