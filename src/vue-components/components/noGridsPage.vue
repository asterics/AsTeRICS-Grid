<template>
    <div class="container ms-0">
        <div class="row ps-2 ps-sm-3 ps-md-4 col-12 col-md-10 col-xl-8 mt-0">
            <h1>{{ $t('newCommunicator') }}</h1>
            <div class="row mt-2">
                <div class="col-12">
                    <button class="big-button col-12" @click="addEmptyGrid()"><span class="fas fa-sticky-note me-2"/> <span>{{ $t('addAnEmptyGridAndStartFromScratch') }}</span></button>
                </div>
            </div>

            <h1 class="mt-5">{{ $t('importPredefinedConfiguration') }}</h1>
            <div>
                <div class="row" v-if="defaultGridsets">
                    <label for="selectGridset" class="col-md-3">{{ $t('selectConfiguration') }}</label>
                    <select v-model="selectedGridset" id="selectGridset" class="col-md-8">
                        <i class="fas fa-sticky-note"></i>
                        <option v-for="set in defaultGridsets" :value="set">{{ set.name + ` (${(set.languages.length > 1 ? $t('multilingual') : $t(`lang.${set.languages[0]}`))})`}}</option>
                    </select>
                </div>
                <div class="row" v-if="selectedGridset">
                    <strong>{{selectedGridset.name}}</strong>
                    <div class="col-11 mt-2">
                        <strong>{{ $t('author') }}</strong>:
                        <span v-if="!selectedGridset.website">{{selectedGridset.author}}</span>
                        <a v-if="selectedGridset.website" :href="selectedGridset.website" target="_blank">{{selectedGridset.author}}</a>
                    </div>
                    <div class="col-11" v-if="selectedGridset.languages.length == 1"><strong>{{ $t('language') }}</strong>: {{ $t('lang.' + selectedGridset.languages[0]) }}</div>
                    <div class="col-11" v-if="selectedGridset.languages.length > 1"><strong>{{ $t('languages') }}</strong>: {{ selectedGridset.languages.reduce((total, current, index, array) => {
                        let separator = index < array.length - 1 ? ', ' : '';
                        return total + $t('lang.' + current) + separator;
                    }, '') }}
                    </div>
                    <div class="col-11" v-if="selectedGridset.description"><strong>{{ $t('description') }}</strong>: <span v-html="i18nService.getTranslation(selectedGridset.description)"></span></div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <button class="big-button col-12" @click="importData">
                            <span v-if="!loading" class="fas fa-file-import me-2"/><span v-if="loading" class="fas fa-spinner fa-spin me-2"/> <span>{{ $t('importPredefinedConfiguration') }}</span>
                        </button>
                    </div>
                </div>
            </div>
            <h1 class="mt-5">{{ $t('importBackup') }}</h1>
            <div>
                <ul class="mt-3">
                    <li><a href="javascript:;" @click="restoreBackupHandler()">{{ $t('restoreBackupFromFile') }}</a></li>
                    <li><a href="javascript:;" @click="importCustomHandler()">{{ $t('importCustomDataFromFile') }}</a></li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {GridData} from "../../js/model/GridData.js";
    import {Router} from "../../js/router.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import $ from "../../js/externals/jquery.js";
    import {serviceWorkerService} from "../../js/service/serviceWorkerService.js";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {GridElement} from "../../js/model/GridElement.js";
    import {arasaacService} from "../../js/service/pictograms/arasaacService.js";

    export default {
        components: {},
        props: ["restoreBackupHandler", "importCustomHandler", "resetGlobalGrid"],
        data() {
            return {
                defaultGridsets: [],
                selectedGridset: null,
                loading: false,
                i18nService: i18nService
            }
        },
        methods: {
            async addEmptyGrid() {
                let label = {};
                let elemLabel = {};
                label[i18nService.getContentLang()] = "New grid";
                elemLabel[i18nService.getContentLang()] = i18nService.tl('helloClickRightToEdit', null, i18nService.getContentLang());
                let gridData = new GridData({
                    label: label,
                    gridElements: [new GridElement({
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                        label: elemLabel,
                        image: arasaacService.getGridImageById(35071),
                    })],
                    rowCount: 1,
                    minColumnCount: 2
                });
                let elements = gridUtil.getFillElements(gridData);
                /*elements.forEach(element => {
                    let label = {};
                    label[i18nService.getContentLang()] = i18nService.t('emptyElement');
                    element.label = label;
                    element.image = new GridImage({
                        url: "https://api.arasaac.org/api/pictograms/4616?download=false&plural=false&color=true",
                        author: "ARASAAC - CC (BY-NC-SA)",
                        authorURL: "https://arasaac.org/terms-of-use",
                        searchProviderName: "ARASAAC"
                    })
                });*/
                gridData.gridElements = gridData.gridElements.concat(elements);
                await dataService.saveGrid(gridData);
                await this.resetGlobalGrid({homeGridId: gridData.id, convertToLowercase: false});
                await dataService.markCurrentConfigAsBackedUp();
                Router.toEditGrid(gridData.id);
            },
            importData() {
                let thiz = this;
                if (!this.selectedGridset) {
                    return;
                }
                this.loading = true;
                $.get(this.getGridsetUrl()).then(result => handleResult(result));
                async function handleResult(result) {

                    //code for checking and correcting imported data
                    /*result.grids.forEach(grid => {
                        grid.gridElements.forEach(element => {
                            element.actions.forEach(action => {
                                if (action.modelName === "GridActionSpeak" || action.modelName === "GridActionSpeakCustom") {
                                    if (action.speakLanguage) {
                                        //log.warn(JSON.stringify(grid.label) + " --> " + JSON.stringify(element.label));
                                        action.speakLanguage = undefined;
                                    }
                                    if (action.speakText) {
                                        log.warn(JSON.stringify(grid.label) + " --> " + JSON.stringify(element.label) + " --> " + JSON.stringify(action.speakText));
                                    }
                                }
                            })
                        })
                    });*/
                    dataService.importBackupData(dataService.normalizeImportData(result), {
                        skipDelete: true
                    }).then(async () => {
                        thiz.loading = false;
                        Router.toMain();
                    });
                }
            },
            getGridsetUrl() {
                return `app/gridsets/${this.selectedGridset.filename}`;
            }
        },
        mounted() {
            let thiz = this;
            $.get('app/gridsets/gridset_metadata.json').then(result => {
                let currentLang = i18nService.getContentLang();
                result.sort((a, b) => {
                    if (a.standardFor && a.standardFor.includes(currentLang)) return -1;
                    if (b.standardFor && b.standardFor.includes(currentLang)) return 1;
                    let aLang = a.languages.includes(currentLang);
                    let bLang = b.languages.includes(currentLang);
                    if (aLang && !bLang) return -1;
                    if (bLang && !aLang) return 1;
                    return a.name.localeCompare(b.name);
                });
                thiz.selectedGridset = result[0];
                thiz.defaultGridsets = result;
                serviceWorkerService.cacheUrl(thiz.getGridsetUrl());
            })
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-top: 1.5em;
}
</style>