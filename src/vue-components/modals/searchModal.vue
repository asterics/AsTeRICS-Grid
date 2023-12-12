<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.esc="$emit('close')">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1>{{ $t('searchElement') }}</h1>
                    </div>

                    <div class="modal-body mt-5 row">
                        <input type="text" v-model="searchTerm" @input="search" v-focus :placeholder="$t('searchElement') + '...'" class="col-12 mb-4" @keydown.enter="goToFirstResult"/>
                        <ul v-if="results && results.length > 0" style="list-style-type: none">
                            <li v-for="result in results">
                                <a href="javascript:;" class="d-flex align-items-center" @click="toResult(result)" style="flex-direction: row; height: 40px;">
                                    <img v-if="result.elem.image" :src="result.elem.image.data || result.elem.image.url" width="40" style="margin-right: 1em"/>
                                    <div class="d-flex align-items-center">
                                        <div>
                                            <span>{{ result.grid.label | extractTranslation }}</span>
                                            <span class="fas fa-arrow-right"/>
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
                        <div v-if="results && results.length === 0 && searchTerm">
                            {{ $t('noSearchResults') }}
                        </div>
                    </div>

                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService.js";
    import {util} from "../../js/util/util.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {Router} from "../../js/router.js";

    export default {
        props: ['routeToEdit'],
        components: {
        },
        data: function () {
            return {
                grids: null,
                initPromise: null,
                searchTerm: '',
                results: undefined,
                i18nService: i18nService
            }
        },
        methods: {
            toResult(result) {
                /*let homeGridId = this.homeGridId || this.graphList[0].grid.id;
                let homeGraphElem = this.graphList.filter(elem => elem.grid.id === homeGridId)[0];
                let path = [homeGraphElem];
                for(let child of homeGraphElem.children) {

                }*/

                if (this.routeToEdit) {
                    Router.toEditGrid(result.grid.id, result.elem.id);
                } else {
                    Router.toGrid(result.grid.id, {
                        highlightIds: [result.elem.id]
                    });
                }
                this.close();
            },
            highlightSearch(text) {
                let index = text.toLocaleLowerCase().indexOf(this.searchTerm.toLocaleLowerCase());
                let realPart = text.substring(index, index + this.searchTerm.length);
                return text.replace(realPart, `<b>${realPart}</b>`)
            },
            goToFirstResult() {
                if (this.results && this.results.length > 0) {
                    this.toResult(this.results[0]);
                }
            },
            async search() {
                let thiz = this;

                util.debounce(async () => {
                    await this.initPromise;
                    this.results = undefined;

                    if (!this.searchTerm) {
                        this.results = [];
                        return;
                    }

                    if (this.searchTerm.length < 2) {
                        this.results = undefined;
                        return;
                    }

                    let results = [];
                    for (let grid of this.grids) {
                        for (let elem of grid.gridElements) {
                            let currentLabel = i18nService.getTranslation(elem.label);
                            let firstLabel = [i18nService.getContentLang(), currentLabel];
                            let labels = firstLabel.concat(Object.entries(elem.label)).filter(([lang, label]) => !!label);
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
                        return a.priority - b.priority
                    });
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
                            priority: priority
                        })
                    }
                }, 300, "SEARCH_ELEMENTS");
            },
            close() {
                this.$emit('close');
            }
        },
        async mounted() {
            this.initPromise = dataService.getGrids(true, true);
            this.grids = await this.initPromise;
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.modal-container {
    min-height: 50vh;
}
</style>