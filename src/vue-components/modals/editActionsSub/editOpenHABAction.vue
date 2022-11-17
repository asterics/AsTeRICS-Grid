<template>
  <div>
    <div class="srow">
      <div class="four columns">
        <label for="inputOpenHABUri" class="normal-text">{{ $t('openHABUrl') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin">
          <input id="inputOpenHABUri" class="six columns" type="text" v-model="openHABUrl"
                 @change="fixOpenHABUrl()">
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
    <div class="srow" v-if="isFetched">
      <div class="four columns">
        <label for="" class="normal-text">{{ $t('selectItem') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin">
          <div class="d-inline" v-for="itemType in itemTypes">
            <input type="radio" v-model="action.openHABActionType" :id="itemType.type" :value="itemType.type"
                   class="custom-radio">
            <label :for="itemType.type" class="button normal-text">{{ $t(itemType.name) }}</label>
          </div>
        </div>
        <div class="srow nomarign" v-if="action.openHABActionType">
          <select v-model="action.openHABItemName">
            <option v-for="item in openHABItems" v-if="item.type === action.openHABActionType" :id="item.name">
              {{ item.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div class="srow" v-if="isFetched && action.openHABActionType && action.openHABItemName">
      <div class="four columns">
        <label v-if="action.openHABActionType !== 'Number:Temperature'" for="commandSelect"
               class="normal-text">{{ $t('selectAction') }}</label>
        <label v-if="action.openHABActionType === 'Number:Temperature'" for="temperatureSelect"
               class="normal-text">{{ $t('setTemperature') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin" v-if="action.openHABActionType !== 'Number:Temperature'">
          <select id="commandSelect" v-for="item in itemTypes" v-if="item.type === action.openHABActionType"
                  v-model="openHABAction" @change="updateAction()">
            <option v-for="command in item.commands" :value="command.value">
              {{ $t(command.name) }}
            </option>
          </select>
        </div>
        <div class="srow nomargin" v-if="action.openHABActionType === 'Number:Temperature'">
          <input id="temperatureSelect" type="number" min="0" max="100" v-model="action.openHABAction">
        </div>
      </div>
      <div class="srow"
           v-if="isFetched && action.openHABActionType && action.openHABItemName && openHABAction === 'CUSTOM VALUE'">
        <div class="four columns">
          <label for="percentSet" class="normal-text">{{ $t('setPercent') }}</label>
        </div>
        <div class="eight columns">
          <div>
            <input id="percentSet" type="number" min="0" max="100" v-model="action.openHABAction">
          </div>
        </div>
      </div>
      <div class="srow"
           v-if="isFetched && action.openHABActionType && action.openHABItemName && openHABAction === 'CUSTOM COLOR'">
        <div class="four columns">
          <label for="colorSet" class="normal-text">{{ $t('setColor') }}</label>
        </div>
        <div class="eight columns">
          <div>
            <input id="colorSet" style="margin-top: 1em" type="color" v-model="customColor"
                   @change="updateColor()">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
//TODO: Error handling, translation, style, more item types
import {openHABService} from "../../../js/service/openHABService";
import {constants} from "../../../js/util/constants";

export default {
  props: ['action', 'gridData'],
  data: () => {
    return {
      openHABUrl: '',
      openHABItems: null,
      openHABAction: '',
      customColor: '',
      isFetched: false,
      itemTypes: [],
      itemAction: ''
    }
  },
  methods: {
    fixOpenHABUrl() {
      this.openHABUrl = openHABService.getRestURL(this.openHABUrl)
      this.updateUrl();
    },
    fetchItems() {
      this.isFetched = undefined;

      openHABService.fetchItems(this.action.openHABUrl).then((data) => {
        this.isFetched = true;
        this.openHABItems = data;
        console.debug(this.openHABItems)
      }).catch((error) => {
        this.isFetched = false;
        console.error(error);
      });
    },
    updateUrl() {
      this.action.openHABUrl = this.openHABUrl;
    },
    updateAction() {
      this.action.openHABAction = this.openHABAction;
    },
    updateColor() {
      this.action.openHABAction = this.toHSL(this.customColor)
    },
    toHSL(hex) {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

      let r = parseInt(result[1], 16);
      let g = parseInt(result[2], 16);
      let b = parseInt(result[3], 16);

      r /= 255;
      g /= 255;
      b /= 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      s = s * 100;
      s = Math.round(s);
      l = l * 100;
      l = Math.round(l);
      h = Math.round(360 * h);

      return h + ',' + s + ',' + l;
    }
  },
  mounted() {
    this.openHABUrl = this.action.openHABUrl || openHABService.getRestURL();
    this.updateUrl();
    this.itemTypes = constants.OPENHAB_TYPES;
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
</style>