<template>
  <div class="srow">
    <div class="four columns">
      <label for="inputOpenHABUri" class="normal-text">{{  $t('openHABUrl')  }}</label>
    </div>
    <div class="eight columns">
      <div class="srow nomargin">
        <input id="inputOpenHABUri" class="six columns" type="text" v-model="action.openHABUrl" @change="fixOpenHABUrl">
        <div class="six columns">
          <button style="width: 70%"><i class="fas fa-bolt"/> <span>{{ $t('fetchItems') }}</span> </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {openHABService} from "../../../js/service/openHABService";

export default {
  props: ['action', 'gridData'],
  data: () => {
    return {}
  },
  methods: {
    fixOpenHABUrl(){
      this.action.openHABUrl = openHABService.getRestURL(this.action.openHABUrl)
      console.log(this.action.openHABUrl)
    }
  }
}
</script>

<style scoped>
  .normal-text{
    font-weight: normal;
  }
</style>