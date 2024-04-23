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
                    <select v-model="selectedGridset" id="selectGridset" class="col-md-8" @change="linkCopied = false">
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
                <div class="mt-2">
                    <a href="javascript:;" class="me-2" @click="copyLink">{{ $t('copyDirectLinkToConfigToClipboard') }}</a>
                    <span v-if="linkCopied" class="fas fa-check"/>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <button class="big-button col-12" @click="importData" :disabled="loading">
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
    import {constants} from '../../js/util/constants';
    import { urlParamService } from '../../js/service/urlParamService';
    import { util } from '../../js/util/util';

    export default {
        components: {},
        props: ["restoreBackupHandler", "importCustomHandler", "resetGlobalGrid"],
        data() {
            return {
                defaultGridsets: [],
                selectedGridset: null,
                loading: false,
                i18nService: i18nService,
                linkCopied: false
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
                await this.resetGlobalGrid({convertToLowercase: false});
                await dataService.markCurrentConfigAsBackedUp();
                let metadata = await dataService.getMetadata();
                metadata.homeGridId = gridData.id;
                await dataService.saveMetadata(metadata);
                Router.toEditGrid(gridData.id);
            },
            importData() {
                let thiz = this;
                if (!this.selectedGridset) {
                    return;
                }
                this.loading = true;
                dataService.importBackupDefaultFile(this.selectedGridset.filename, {
                    skipDelete: true
                }).then(async () => {
                    thiz.loading = false;
                    Router.toMain();
                });
            },
            copyLink() {
                let link = location.origin + location.pathname + `?${urlParamService.params.PARAM_USE_GRIDSET_FILENAME}=${this.selectedGridset.filename}`;
                util.copyToClipboard(link);
                this.linkCopied = true;
            }
        },
        mounted() {
            let thiz = this;
            $.get(constants.GRIDSET_FOLDER + 'gridset_metadata.json').then(result => {
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
                serviceWorkerService.cacheUrl(constants.GRIDSET_FOLDER + this.selectedGridset.filename);
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