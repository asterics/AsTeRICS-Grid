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
            <input type="radio" v-model="action.openHABActionType" :id="itemType.type" :value="itemType.type">
            <label :for="itemType.type" class="button">{{ $t(itemType.type) }}</label>
          </div>
        </div>
        <div class="srow nomarign" v-if="action.openHABActionType">
          <select v-model="action.openHABItemName">
            <option selected value="">{{ $t('empty') }}</option>
            <option v-for="item in openHABItems" v-if="item.type === action.openHABActionType" :id="item.name">
              {{ item.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div class="srow" v-if="isFetched && action.openHABActionType">
      <div class="four columns">
        <label for="commandSelect" class="normal-text">{{ $t('selectAction') }}</label>
      </div>
      <div class="eight columns">
        <div class="srow nomargin">
          <select id="commandSelect" v-for="item in itemTypes" v-if="item.type === action.openHABActionType" v-model="action.openHABAction">
            <option selected value="">{{ $t('empty') }}</option>
            <option v-for="command in item.commands" :value="command">
              {{ $t(command) }}
            </option>
          </select>
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
      isFetched: false,
      itemTypes:[],
      itemAction:''
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
        console.log(this.openHABItems)
      }).catch((error) => {
        this.isFetched = false;
        console.error(error);
      });
    },
    updateUrl() {
      this.action.openHABUrl = this.openHABUrl;
    }
  },
  mounted() {
    this.openHABUrl = this.action.openHABUrl || openHABService.getRestURL();
    this.updateUrl();
    this.itemTypes = constants.OPENHAB_TYPES
  }
}
</script>

<style scoped>
.normal-text {
  font-weight: normal;
}
</style>