<template>
    <div>
        <search-bar v-model="currentValue.searchTerm" @input="changed"/>
        <accordion :acc-label="$t('moreSearchOptions')" class="mt-3">
            <div class="container-fluid p-0">
                <div class="row mt-2">
                    <label>{{ $t('language') }}</label>
                    <select v-model="currentValue.lang" @change="changed">
                        <option value="">(all)</option>
                        <option v-for="lang in selectLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                </div>
                <div class="row" v-if="hideType !== true">
                    <label>{{ $t('type') }}</label>
                    <select v-model="currentValue.type" @change="changed">
                        <option value="">(all)</option>
                        <option :value="constants.BOARD_TYPE_SELFCONTAINED">{{ $t(constants.BOARD_TYPE_SELFCONTAINED) }}</option>
                        <option :value="constants.BOARD_TYPE_SINGLE">{{ $t(constants.BOARD_TYPE_SINGLE) }}</option>
                    </select>
                </div>
                <div class="row">
                    <label>{{ $t('searchProvider') }}</label>
                    <select v-model="currentValue.provider" @change="changed">
                        <option value="">(all)</option>
                        <option v-for="name in providerNames" :value="name">{{ name }}</option>
                    </select>
                </div>
            </div>
        </accordion>
    </div>
</template>

<script>
import Accordion from './accordion.vue';
import SearchBar from './searchBar.vue';
import { constants } from '../../js/util/constants';
import { i18nService } from '../../js/service/i18nService';
import { externalBoardsService } from '../../js/service/boards/externalBoardsService';

export default {
    components: { SearchBar, Accordion },
    props: ["value", "hideType"],
    data() {
        return {
            currentValue: this.value,
            allLanguages: i18nService.getAllLanguages(),
            providerNames: externalBoardsService.getProviders(),
            selectLanguages: [],
            constants: constants
        }
    },
    watch: {
        value: function(newVal, oldVal) {
            this.currentValue = newVal;
        }
    },
    methods: {
        changed() {
            this.$emit('input', this.currentValue);
            this.$emit('change', this.currentValue);
        }
    },
    async mounted() {
        let allPreviews = await externalBoardsService.query(); // in order to get all languages
        this.selectLanguages = this.allLanguages.filter(lang => allPreviews.some(preview => preview.languages.includes(lang.code)));
        this.currentValue.lang = this.selectLanguages.map(e => e.code).includes(i18nService.getAppLang()) ? i18nService.getAppLang() : "";
        this.changed();
    },
}
</script>

<style scoped>
</style>