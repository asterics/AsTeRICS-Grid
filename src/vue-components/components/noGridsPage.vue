<template>
    <div class="p-4">
        <h2 class="my-3">{{ $t('chooseHowToStart') }}</h2>
        <div class="mt-2 mb-5">
            <a href="javascript:;" @click="restoreBackupHandler()"><span class="fa fa-file-import"/> {{ $t('restoreBackupFromFile') }}</a>
        </div>

        <div class="my-3">
            <input class="col-12" id="searchBar" type="text" v-model="searchTerm" @input="search" :aria-label="$t('search')" :placeholder="$t('search')"/>
            <accordion :acc-label="$t('moreSearchOptions')" class="mt-3">
                <div class="container-fluid p-0">
                    <div class="row mt-2">
                        <label>{{ $t('language') }}</label>
                        <select v-model="searchOptions.lang" @change="search">
                            <option value="">(all)</option>
                            <option v-for="lang in selectLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                        </select>
                    </div>
                    <div class="row">
                        <label>{{ $t('type') }}</label>
                        <select v-model="searchOptions.type" @change="search">
                            <option value="">(all)</option>
                            <option :value="constants.BOARD_TYPE_SELFCONTAINED">{{ $t(constants.BOARD_TYPE_SELFCONTAINED) }}</option>
                            <option :value="constants.BOARD_TYPE_SINGLE">{{ $t(constants.BOARD_TYPE_SINGLE) }}</option>
                        </select>
                    </div>
                </div>
            </accordion>
        </div>
        <div v-if="gridPreviews" class="mt-5">
            <ul id="boardGrid">
                <li v-for="preview in gridPreviews">
                    <div class="preview-content">
                        <strong class="d-block mb-3">{{ preview.name | extractTranslation }}</strong>
                        <img aria-hidden="true" v-if="preview.thumbnail" :src="preview.thumbnail" style="width: 100%"/>
                        <div v-if="!preview.thumbnail" class="img-placeholder mb-3" style="aspect-ratio: 16/9; width: 99%; border: 1px solid lightgray"></div>
                        <div class="d-flex col-12" style="flex-wrap: wrap">
                            <span class="tag" style="background-color: lightgreen">{{ preview.languages.length === 1 ? $t(`lang.${preview.languages[0]}`) : "multi-lang" }}</span>
                            <span class="tag" style="background-color: lightgray" v-for="tag in preview.tags">{{ tag }}</span>
                        </div>
                    </div>
                    <div class="preview-buttons d-flex justify-content-between">
                        <button @click="detailPreview = preview"><span class="fa fa-info-circle"/> {{ $t('details') }}</button>
                        <button class="btn-primary" @click="importData(preview)"><span class="fa fa-check"/> {{ $t('useIt') }}</button>
                    </div>
                </li>
            </ul>
        </div>
        <config-preview-detail v-if="detailPreview" :preview="detailPreview" @close="detailPreview = null" @import="importData(detailPreview)"></config-preview-detail>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {Router} from "../../js/router.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from '../../js/util/constants';
    import { urlParamService } from '../../js/service/urlParamService';
    import { util } from '../../js/util/util';
    import {boardService} from '../../js/service/boards/boardService';
    import Accordion from './accordion.vue';
    import { MainVue } from '../../js/vue/mainVue';
    import ConfigPreviewDetail from '../modals/configPreviewDetail.vue';

    export default {
        components: { ConfigPreviewDetail, Accordion },
        props: ["restoreBackupHandler", "importCustomHandler", "resetGlobalGrid"],
        data() {
            return {
                gridPreviews: [],
                selectedGridset: null,
                loading: false,
                i18nService: i18nService,
                linkCopied: false,
                searchTerm: '',
                searchOptions: {
                    lang: "",
                    type: constants.BOARD_TYPE_SELFCONTAINED
                },
                allLanguages: i18nService.getAllLanguages(),
                selectLanguages: [],
                constants: constants,
                detailPreview: null
            }
        },
        methods: {
            search() {
                util.debounce(async () => {
                    this.gridPreviews = await boardService.query(this.searchTerm, this.searchOptions);
                }, 300, "SEARCH_BOARDS");
            },
            importData(preview) {
                let thiz = this;
                this.loading = true;
                dataService.importBackupFromUrl(preview.url, {
                    skipDelete: true,
                    translate: preview.translate,
                    filename: preview.filename,
                    progressFn: (percent, text) => {
                        MainVue.showProgressBar(percent, {
                            header: i18nService.t('importingData'),
                            text: text
                        });
                    }
                }).then(async () => {
                    thiz.loading = false;
                    if (preview.translate) { // currently empty config is the only one with .translate prop
                        Router.toEditGrid();
                    } else {
                        Router.toMain();
                    }
                });
            }
        },
        async mounted() {
            let thiz = this;
            thiz.gridPreviews = await boardService.query();
            thiz.selectLanguages = this.allLanguages.filter(lang => this.gridPreviews.some(preview => preview.languages.includes(lang.code)));
            thiz.searchOptions.lang = thiz.selectLanguages.map(e => e.code).includes(i18nService.getAppLang()) ? i18nService.getAppLang() : "";
            thiz.gridPreviews = await boardService.query("", thiz.searchOptions);
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

#boardGrid li {
    box-shadow: 1px 1px 3px lightgray;
    border-radius: 5px;
    padding: 10px;
    border: 1px solid lightgray;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#boardGrid li .preview-content {
    max-height: 85%;
}

#boardGrid li .preview-buttons {
    margin-top: 1em;
    bottom: 0.5em;
}

#boardGrid li button {
    width: 49%;
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

.tag {
    flex-shrink: 1;
    margin: 0.3em 0.3em 0.3em 0;
    border-radius: 5px;
    padding: 0px 3px 0px 3px;
}
</style>