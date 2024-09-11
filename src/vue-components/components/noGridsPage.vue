<template>
    <div class="p-4">
        <h2 class="my-3">{{ $t('chooseHowToStart') }}</h2>
        <div class="container-fluid">
            <div class="mt-2 mb-5 row">
                <a href="javascript:;" class="col-12 col-lg" @click="restoreBackupHandler()"><span class="fas fa-upload"/> {{ $t('restoreBackupFromFile') }}</a>
                <a href="javascript:;" class="col-12 col-lg" @click="importCustomHandler()"><span class="fas fa-file-import"/> {{ $t('importGrids') }}</a>
            </div>
        </div>

        <div class="my-3">
            <search-bar-grid-previews v-model="searchOptions" @input="search"/>
        </div>
        <div v-if="gridPreviews" class="mt-5">
            <ul id="boardGrid">
                <grid-preview-card v-for="(preview, index) in gridPreviews" v-if="index < limitResults" :key="preview.id" :preview="preview" :detail-button-callback="(preview) => detailPreview = preview" :use-button-callback="importData"/>
                <grid-preview-card v-if="limitResults < gridPreviews.length" :more-button-callback="() => limitResults += 10"/>
            </ul>
        </div>
        <grid-preview-details-modal v-if="detailPreview" :preview="detailPreview" @close="detailPreview = null" @import="importData(detailPreview)"></grid-preview-details-modal>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {Router} from "../../js/router.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from '../../js/util/constants';
    import { util } from '../../js/util/util';
    import {externalBoardsService} from '../../js/service/boards/externalBoardsService';
    import Accordion from './accordion.vue';
    import { MainVue } from '../../js/vue/mainVue';
    import GridPreviewDetailsModal from '../modals/gridPreviewDetailsModal.vue';
    import SearchBar from './searchBar.vue';
    import GridPreviewCard from './gridPreviewCard.vue';
    import SearchBarGridPreviews from './searchBarGridPreviews.vue';

    export default {
        components: { SearchBarGridPreviews, GridPreviewCard, SearchBar, GridPreviewDetailsModal, Accordion },
        props: ["restoreBackupHandler", "importCustomHandler", "resetGlobalGrid"],
        data() {
            return {
                gridPreviews: [],
                loading: false,
                searchOptions: {
                    searchTerm: "",
                    lang: "",
                    type: constants.BOARD_TYPE_SELFCONTAINED,
                    provider: ""
                },
                limitResults: 20,
                constants: constants,
                detailPreview: null
            }
        },
        methods: {
            search() {
                let timeout = this.searchOptions.searchTerm ? 500 : 0;
                util.debounce(async () => {
                    this.gridPreviews = await externalBoardsService.query(this.searchOptions.searchTerm, this.searchOptions);
                }, timeout, "SEARCH_BOARDS");
            },
            importData(preview) {
                let thiz = this;
                this.loading = true;
                dataService.importBackupFromPreview(preview, {
                    progressFn: (percent, text) => {
                        MainVue.showProgressBar(percent, {
                            header: i18nService.t('importingData'),
                            text: text
                        });
                    }
                }).then(async (success) => {
                    thiz.loading = false;
                    if (!success) {
                        return;
                    }
                    if (preview.translate) { // currently empty config is the only one with .translate prop
                        Router.toEditGrid();
                    } else {
                        Router.toMain();
                    }
                });
            }
        },
        async mounted() {
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

.row {
    margin-top: 1.5em;
}
</style>