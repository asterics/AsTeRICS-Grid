<template>
    <modal :title="$t('searchElement')" style="z-index: 9999" :footer="false">
        <template #default>
            <div class="modal-body mt-5 row">
                <input type="text" v-model="searchTerm" @input="search()" v-focus :placeholder="$t('searchElement') + '...'" class="col-8 col-sm-10" @keydown.enter.exact="goToFirstResult()" @keydown.ctrl.enter.exact="goToFirstResult(true)"/>
                <div class="col-sm-2 col-4">
                    <button class="col-12 mb-0" :title="$t('search')"><i class="fas fa-search"/></button>
                </div>
            </div>
            <div>
                <div class="warn mt-5" v-if="results && !homeGridId">
                    <i class="fas fa-info-circle"></i>
                    <span>{{ $t('infoPleaseDefineAHomeGridInManageGrids') }}</span>
                </div>
                <ul v-if="results && results.length > 0" style="list-style-type: none" class="mt-5">
                    <li v-for="(result, index) in results" class="d-flex align-items-center" style="flex-direction: row; min-height: 40px;">
                        <a href="javascript:;" @click="toResult(result)" class="d-flex align-items-center" :title="index === 0 ? `${$t('showElement')} ${$t('keyboardEnter')}` : $t('showElement')">
                            <img v-if="result.elem.image" :src="result.elem.image.data || result.elem.image.url" width="40" style="margin-right: 1em"/>
                        </a>
                        <a href="javascript:;" @click="toResult(result, true)" class="d-flex align-items-center" :title="index === 0 ? `${$t('showPathToElement')} ${$t('keyboardCtrlEnter')}` : $t('showPathToElement')">
                            <div class="d-flex align-items-center">
                                <div>
                                    <span v-for="(pathElem, index) in result.path">
                                        <span v-if="index === 0">{{ $t('homeGrid')  }}<span class="fas fa-arrow-right mx-2"/></span>
                                        <span v-if="pathElem.toNextElementLabel">{{ pathElem.toNextElementLabel | extractTranslation }}<span class="fas fa-arrow-right mx-2"/></span>
                                    </span>
                                    <span v-if="i18nService.getContentLang() === result.matchLang" v-html="highlightSearch(result.matchLabel)"></span>
                                    <span v-if="i18nService.getContentLang() !== result.matchLang">
                                        <span>{{ i18nService.getTranslation(result.elem.label) }}</span>
                                        <span>( {{ i18nService.t(`lang.${result.matchLang}`) }}: <span v-html="highlightSearch(result.matchLabel)"></span> )</span>
                                    </span>
                                </div>
                            </div>
                        </a>
                    </li>
                </ul>
                <div class="mt-5">
                    <div v-if="results === null">
                        {{ $t('searching') }}
                    </div>
                    <div v-if="results && results.length === 0 && searchTerm">
                        {{ $t('noSearchResults') }}
                    </div>
                    <div v-if="overflow">
                        {{ $t('notShowingAllResultsTryALongerSearchTerm') }}
                    </div>
                </div>
            </div>
        </template>
    </modal>
</template>

<script>
    import { modalMixin } from '../mixins/modalMixin.js';
    import {dataService} from "../../js/service/data/dataService.js";
    import {util} from "../../js/util/util.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {Router} from "../../js/router.js";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {collectElementService} from "../../js/service/collectElementService.js";

    export default {
        mixins: [modalMixin],
        data: function () {
            return {
                grids: null,
                initPromise: null,
                searchTerm: '',
                results: undefined,
                graphList: [],
                homeGridId: null,
                i18nService: i18nService,
                idPathMap: null,
                overflow: false,
                MAX_RESULTS: 10
            }
        },
        computed: {
            routeToEdit() {
                return this.$store.state.routeToEdit;
            },
            options() {
                return this.$store.state.searchModalOptions;
            }
        },
        methods: {
            toResult(result, usePath) {
                if (this.routeToEdit) {
                    Router.toEditGrid(result.grid.id, result.elem.id);
                } else {
                    let highlightIds = [result.elem.id];
                    let firstGrid = result.grid.id;
                    if (usePath && result.path.length > 1) {
                        firstGrid = result.path[0].id;
                        highlightIds = result.path.map(e => e.toNextElementId);
                        highlightIds[highlightIds.length - 1] = result.elem.id;
                    }
                    Router.toGrid(firstGrid, {
                        highlightIds: highlightIds
                    });
                }
                this.close();
            },
            highlightSearch(text) {
                let index = text.toLocaleLowerCase().indexOf(this.searchTerm.toLocaleLowerCase());
                let realPart = text.substring(index, index + this.searchTerm.length);
                return text.replace(realPart, `<b>${realPart}</b>`)
            },
            goToFirstResult(usePath) {
                if (this.results && this.results.length > 0) {
                    this.toResult(this.results[0], usePath);
                }
            },
            async search(force) {
                let thiz = this;
                util.debounce(async () => {
                    thiz.overflow = false;
                    if (!force && thiz.searchTerm.length < 2) {
                        thiz.results = undefined;
                        return;
                    }
                    thiz.results = null;
                    thiz.$forceUpdate();
                    await new Promise(resolve => setTimeout(resolve, 10)); // to repaint and render "searching ..."
                    await thiz.initPromise;
                    if (!thiz.searchTerm) {
                        thiz.results = [];
                        return;
                    }
                    let results = [];
                    let homeGridId = thiz.homeGridId || thiz.graphList[0].grid.id;
                    let homeGridGraphElem = thiz.graphList.filter(elem => elem.grid.id === homeGridId)[0];
                    if (!thiz.idPathMap) {
                        thiz.idPathMap = gridUtil.getIdPathMap(homeGridGraphElem);
                    }
                    let count = 0;
                    for (let grid of thiz.grids) {
                        for (let elem of grid.gridElements) {
                            count++;
                            let labels = Object.entries(elem.label).filter(([lang, label]) => !!label);
                            let hadMatch = false;
                            for (let [lang, label] of labels) {
                                let priority = getMatchPriority(label);
                                if (!hadMatch && priority > 0) {
                                    hadMatch = true;
                                    addResult(grid, elem, label, lang, priority);
                                }
                            }
                        }
                    }
                    results.sort((a, b) => {
                        if (a.matchLang !== b.matchLang) {
                            if (a.matchLang === i18nService.getContentLang()) {
                                return -1;
                            }
                            if (b.matchLang === i18nService.getContentLang()) {
                                return 1;
                            }
                        }
                        if (a.path.length !== b.path.length) {
                            if (a.path.length === 0) return 1;
                            if (b.path.length === 0) return -1;
                            return a.path.length - b.path.length;
                        }
                        return a.priority - b.priority
                    });
                    if (results.length > thiz.MAX_RESULTS) {
                        results = results.slice(0, thiz.MAX_RESULTS - 1);
                        thiz.overflow = true;
                    }
                    thiz.results = results;

                    function getMatchPriority(label) {
                        label = label.toLocaleLowerCase();
                        if (label.startsWith(thiz.searchTerm.toLocaleLowerCase())) {
                            return 1;
                        }
                        if (label.includes(thiz.searchTerm.toLocaleLowerCase())) {
                            return 2;
                        }
                        return -1;
                    }

                    function addResult(grid, elem, matchLabel, matchLang, priority) {
                        results.push({
                            grid: grid,
                            elem: elem,
                            matchLabel: matchLabel,
                            matchLang: matchLang,
                            priority: priority,
                            path: gridUtil.getGridPath(thiz.graphList, homeGridId, grid.id, thiz.idPathMap)
                        })
                    }
                }, 300, "SEARCH_ELEMENTS");
            },
            close() {
                this.$emit('close');
            }
        },
        async mounted() {
            this.initPromise = new Promise(async resolve => {
                this.grids = await dataService.getGrids(true, true);
                this.graphList = gridUtil.getGraphList(this.grids);
                let metadata = await dataService.getMetadata();
                this.homeGridId = metadata.homeGridId;
                resolve();
            });
            if (this.options) {
                this.searchTerm = this.options.searchCollectedText ? collectElementService.getText() : this.options.searchText || '';
                if (this.searchTerm) {
                    this.search(true);
                }
            }
            $('.grid-item-content').removeClass('highlight');
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.modal-container {
    min-height: 50vh;
}

input, button {
    border-width: 1px;
}
</style>