<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')" @keydown.ctrl.enter="exportData()">
                    <div class="container-fluid px-0">
                        <div class="row">
                            <div class="modal-header col-8 col-sm-10 col-md-10">
                                <h1 class="inline">{{ $t('exportShareGrids') }}</h1>
                            </div>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:void(0);" :title="$t('close')" @click="$emit('close')"><i class="fas fa-times"/></a>
                        </div>
                    </div>

                    <div class="modal-body mt-1">
                        <nav-tabs :tab-labels="[tab_constants.TAB_EXPORT_FILE, tab_constants.TAB_EXPORT_ONLINE]" v-model="currentTab"></nav-tabs>
                        <div v-if="currentTab === tab_constants.TAB_EXPORT_FILE">
                            <export-modal-data-selector v-model="backupInfo" :export-options="exportOptions"></export-modal-data-selector>
                        </div>
                        <div v-if="currentTab === tab_constants.TAB_EXPORT_ONLINE">
                            <div class="d-flex align-items-center mb-5">
                                <img class="me-3" src="app/img/globalsymbols_logo.png" alt="" style="width: 40px; outline: none">
                                <div v-if="!loggedIn">
                                    <span>{{ $t('toExportBoardsToLogIn', [constants.GLOBALSYMBOLS_NAME]) }}</span>
                                    <a href="javascript:;" @click="login">{{ $t('login') }}</a>
                                </div>
                                <div v-if="loggedIn">
                                    <span>{{ $t('youAreLoggedInToAs', [constants.GLOBALSYMBOLS_NAME, loggedInUser]) }}.</span>
                                    <a href="javascript:;" @click="logout">{{ $t('logout') }}</a>
                                </div>
                            </div>
                            <div v-if="loggedIn">
                                <export-modal-data-selector v-model="backupInfo" :export-options="exportOptions" :hide-advanced-settings="true"></export-modal-data-selector>
                                <form id="exportOnlineForm" @submit="(event) => event.preventDefault()" ref="form" class="mb-0">
                                    <div class="row">
                                        <div class="col-12 col-md-4">
                                            <div class="row">
                                                <label for="exportName">{{ $t('titleOfExportedGrids') }}</label>
                                                <div class="col-12">
                                                    <input class="col-12" id="exportName" type="text" v-model="metadata.name" required maxlength="250">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-4">
                                            <div class="row">
                                                <label for="author">{{ $t('author') }}</label>
                                                <div class="col-12">
                                                    <input class="col-12" id="author" type="text" v-model="metadata.author" required maxlength="100">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-4">
                                            <div class="row">
                                                <label for="authorURL">{{ $t('authorURL') }}</label>
                                                <div class="col-12">
                                                    <input class="col-12" id="authorURL" maxlength="200" pattern="https?://.*" type="text" v-model="metadata.author_url" :placeholder="$t('optionalBracket')">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 col-md-6">
                                            <label for="desc">{{ $t('description') }}</label>
                                            <div class="col-12">
                                                <textarea class="col-12" id="desc" v-model="metadata.description" maxlength="1000" :placeholder="$t('optionalBracket')"></textarea>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label for="selectTags">{{ $t('tags') }}</label>
                                            <div class="col-12">
                                                <multiselect id="selectTags" class="col-12" v-model="metadata.tags" :options="possibleTags" @tag="addTag($event)" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" :max="10" :placeholder="$t('chooseTagsOrAddNew')">
                                                </multiselect>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="selfContained" v-model="metadata.self_contained">
                                        <label for="selfContained">{{ $t('gridsAreSelfContained') }}</label>
                                    </div>
                                    <div class="mb-4">
                                        <i class="fas fa-info-circle"></i> {{ $t('selfContainedInfo') }}
                                    </div>
                                    <div>
                                        <input type="checkbox" id="public" v-model="metadata.public">
                                        <label for="public">{{ $t('makePublic') }}</label>
                                    </div>
                                    <div>
                                        <i class="fas fa-info-circle"></i> {{ $t('publicInfo') }}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button form="exportOnlineForm" :disabled="currentTab === tab_constants.TAB_EXPORT_ONLINE && !loggedIn" class="six columns" @click="exportData()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/>
                                <span v-if="currentTab === tab_constants.TAB_EXPORT_FILE">{{ $t('downloadBackup') }}</span>
                                <span v-if="currentTab === tab_constants.TAB_EXPORT_ONLINE">{{ $t('exportToGlobalSymbols') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {dataService} from '../../js/service/data/dataService'
import './../../css/modal.css';
import {helpService} from "../../js/service/helpService";
import {i18nService} from "../../js/service/i18nService.js";
import NavTabs from '../components/nav-tabs.vue';
import { MainVue } from '../../js/vue/mainVue';
import ExportModalDataSelector from './exportModalDataSelector.vue';
import { constants } from '../../js/util/constants';
import { localStorageService } from '../../js/service/data/localStorageService';
import { oauthServiceGlobalSymbols } from '../../js/service/oauth/oauthServiceGlobalSymbols';
import Multiselect from 'vue-multiselect';
import Accordion from '../components/accordion.vue';

let tab_constants = {
    TAB_EXPORT_FILE: 'TAB_EXPORT_FILE',
    TAB_EXPORT_ONLINE: 'TAB_EXPORT_ONLINE'
}

export default {
    components: { Accordion, Multiselect, ExportModalDataSelector, NavTabs },
    props: ['exportOptions'],
    data: function () {
        return {
            backupInfo: {
                gridIds: [],
                options: {}
            },
            currentTab: tab_constants.TAB_EXPORT_FILE,
            tab_constants: tab_constants,
            i18nService: i18nService,
            metadata: {
                name: '',
                description: '',
                tags: [],
                lang: '',
                author: '',
                author_url: '',
                self_contained: false,
                public: true,
                thumbnail: ''
            },
            loggedIn: false,
            loggedInUser: '',
            possibleTags: JSON.parse(JSON.stringify(constants.EXPORT_ONLINE_GRID_TAGS)),
            constants: constants
        }
    },
    methods: {
        login() {
            let exportOptions = Object.assign({}, this.exportOptions, this.backupInfo.options);
            exportOptions.currentTab = tab_constants.TAB_EXPORT_ONLINE;
            localStorageService.setRedirectTarget(constants.OAUTH_REDIRECT_GS_UPLOAD, {exportOptions: exportOptions});
            oauthServiceGlobalSymbols.login();
        },
        logout() {
            oauthServiceGlobalSymbols.logout();
            this.loggedIn = false;
            this.loggedInUser = '';
        },
        exportData() {
            this.backupInfo.options.progressFn = (percent, text) => {
                MainVue.showProgressBar(percent, {
                    header: i18nService.t('exportShareGrids'),
                    text: text
                });
            };
            if (this.currentTab === tab_constants.TAB_EXPORT_FILE) {
                dataService.downloadToFile(this.backupInfo.gridIds, this.backupInfo.options);
            } else if (this.currentTab === tab_constants.TAB_EXPORT_ONLINE) {
                if (!this.$refs.form.reportValidity()) {
                    log.warn('form is invalid');
                    return;
                }
                if(this.metadata.public && !confirm(i18nService.t('confirmExportPublicNoPrivateImages'))) {
                    return;
                }
                log.warn('export!');
                return;
                oauthServiceGlobalSymbols.exportGrids(this.backupInfo.gridIds, this.metadata);
            }
            this.$emit('close');
        },
        addTag(tag) {
            tag = tag.toLocaleUpperCase().replace(/\s/g,'').substring(0, 20);
            this.metadata.tags.push(tag.toLocaleUpperCase());
            this.possibleTags.push(tag.toLocaleUpperCase());
        },
        openHelp() {
            helpService.openHelp();
        }
    },
    async mounted() {
        this.loggedIn = await oauthServiceGlobalSymbols.isLoggedIn();
        this.loggedInUser = await oauthServiceGlobalSymbols.getUsername();
        this.currentTab = this.exportOptions.currentTab || tab_constants.TAB_EXPORT_FILE;
    },
    beforeDestroy() {
        helpService.revertToLastLocation();
    }
}
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}

.modal-container {
    min-height: 50vh;
}
</style>