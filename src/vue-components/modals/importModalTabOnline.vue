<template>
    <div>
        <search-bar-grid-previews v-model="searchOptions" :hide-type="true" @input="search"/>
        <div v-if="gridPreviews" class="mt-5">
            <ul id="boardGrid">
                <grid-preview-card v-for="preview in gridPreviews" :key="preview.id" :preview="preview" :use-button-callback="selectPreview"/>
            </ul>
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

    export default {
        components: { GridPreviewCard, SearchBarGridPreviews },
        props: ['gridElement'],
        data: function () {
            return {
                gridPreviews: [],
                searchOptions: {
                    searchTerm: "",
                    lang: "",
                    type: constants.BOARD_TYPE_SINGLE,
                    provider: ""
                }
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

            }
        },
        mounted() {
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