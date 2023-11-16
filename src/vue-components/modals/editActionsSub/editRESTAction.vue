<template>
    <div class="container-fluid px-0">
        <div class="row">
          <label class="col-12 col-md-4 normal-text" for="inputRestUri">{{ $t('httpUrl') }}</label>
          <div class="col-12 col-md-8">
            <div class="row m-0">
              <div class="col-10 col-sm-11">
                <input class="col-12" id="inputRestUri" v-model="action.restUrl"
                       spellcheck="false" autocomplete="true" type="text" :placeholder="$t('httpshostnameportpathToRestFunction')">
              </div>
            </div>
          </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="body">{{ $t('httpBodyData') }}</label>
            <div class="col-12 col-md-8">
                <div class="row m-0">
                    <div class="col-10 col-sm-11">
                        <input id="body" v-model="action.body" class="col-12"
                               :placeholder="$t('egOnoff')" spellcheck="false" autocomplete="true" type="text">
                    </div>
                </div>
            </div>
        </div>
      <div class="row">
        <label class="col-12 col-md-4 normal-text" for="method">{{ $t('httpMethod') }}</label>
        <div class="col-12 col-md-8">
          <div class="row m-0">
            <div class="col-10 col-sm-11">
              <input id="method" v-model="action.method" class="col-12"
                     placeholder="POST|PUT|GET|..." spellcheck="false" autocomplete="true" type="text">
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <label class="col-12 col-md-4 normal-text" for="content-type">{{ $t('httpContenttype') }}</label>
        <div class="col-12 col-md-8">
          <div class="row m-0">
            <div class="col-10 col-sm-11">
              <input id="content-type" v-model="action.contentType" class="col-12"
                     placeholder="text/plain|application/json|..." spellcheck="false" autocomplete="true" type="text">
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import {restService} from "../../../js/service/restService";
import {i18nService} from "../../../js/service/i18nService.js";
import {GridData} from "../../../js/model/GridData.js";
import {arasaacService} from "../../../js/service/pictograms/arasaacService.js";

export default {
    props: ['action', 'gridData'],
    computed: {
    },
    methods: {
    },
    mounted() {
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