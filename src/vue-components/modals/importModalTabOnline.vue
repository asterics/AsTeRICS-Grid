<template>
    <div>
        <div v-if="!currentValue.selectedPreview">
            <search-bar-grid-previews v-model="searchOptions" :hide-type="true" @input="search"/>
            <div v-if="gridPreviews" class="mt-5">
                <ul id="boardGrid">
                    <grid-preview-card v-for="preview in gridPreviews" :key="preview.id" :preview="preview" :use-button-callback="selectPreview" use-button-label="select"/>
                </ul>
            </div>
        </div>
        <div v-if="currentValue.selectedPreview">
            <h2>{{ $t('selectedConfiguration', [currentValue.selectedPreview.name]) }}</h2>
            <div class="mb-4">
                <a href="javascript:;" @click="currentValue.selectedPreview = null">{{ $t('backToSearch') }}</a>
            </div>
            <grid-preview-details :preview="currentValue.selectedPreview"/>
            <div v-if="graphList.length > 0" class="row mt-5">
                <label for="target" class="col-12 col-md-4">{{ $t('createLinksToImportedGridsAt') }}</label>
                <select id="target" v-model="currentValue.targetGrid" class="col-12 col-md-4">
                    <option v-for="item of graphList" :value="item.grid">{{ i18nService.getTranslation(item.grid.label) }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import SearchBarGridPreviews from '../components/searchBarGridPreviews.vue';
    import { constants } from '../../js/util/constants';
    import { util } from '../../js/util/util';
    import { externalBoardsService } from '../../js/service/boards/externalBoardsService';
    import GridPreviewCard from '../components/gridPreviewCard.vue';
    import GridPreviewDetails from './gridPreviewDetails.vue';
    import { dataService } from '../../js/service/data/dataService';
    import { i18nService } from '../../js/service/i18nService';

    export default {
        components: { GridPreviewDetails, GridPreviewCard, SearchBarGridPreviews },
        props: ['value', 'selectedPreviewProp'],
        data: function () {
            return {
                gridPreviews: [],
                searchOptions: {
                    searchTerm: "",
                    lang: "",
                    type: constants.BOARD_TYPE_SINGLE,
                    provider: ""
                },
                currentValue: {
                    selectedPreview: this.selectedPreviewProp,
                    targetGrid: null
                },
                graphList: [],
                i18nService: i18nService
            }
        },
        watch: {
            value: function(newVal, oldVal) {
                this.currentValue = newVal;
            },
            currentValue: {
                handler: function(newVal) {
                    this.$emit('input', this.currentValue);
                    this.$emit('change', this.currentValue);
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            search() {
                let timeout = this.searchOptions.searchTerm ? 500 : 0;
                util.debounce(async () => {
                    this.gridPreviews = await externalBoardsService.query(this.searchOptions.searchTerm, this.searchOptions);
                }, timeout, "SEARCH_BOARDS");
            },
            selectPreview(preview) {
                this.currentValue.selectedPreview = preview;
            },
        },
        async mounted() {
            this.graphList = await dataService.getGridsGraphList();
            this.currentValue.targetGrid = this.graphList[0] ? this.graphList[0].grid : null;
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
#boardGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 400px); grid-gap: 1rem; list-style-type: none
}

@media (max-width: 500px) {
    #boardGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 100%); grid-gap: 1rem; list-style-type: none
    }
}
</style>