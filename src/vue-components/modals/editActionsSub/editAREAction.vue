<template>
    <div>
        <test-are-connection v-model="action.areURL"/>
        <div class="srow">
            <div class="four columns">
                <label class="normal-text">{{ $t('areModel') }}</label>
            </div>
            <div class="eight columns">
                <div class="srow nomargin">
                    <div class="twelve columns">
                        <span v-show="loading">{{ $t('loadingModelFromAre') }}</span>
                        <span v-show="!loading && areModelSync && areModelFile && !areModelFile.dataBase64">{{ $t('couldNotLoadModelFromAre') }}</span>
                        <span v-show="!loading && !areModelSync && areModelFile && !areModelFile.dataBase64">{{ $t('noAreModel') }}</span>
                        <span v-if="!loading && areModelFile && areModelFile.dataBase64">
                            <a href="javascript:void(0);" @click="downloadModelFile(areModelFile)">{{areModelFile.fileName}}</a>
                        </span>
                    </div>
                </div>
                <div class="srow">
                    <button class="six columns" @click="reloadAREModel(action)"><i class="fas fa-download"/> <span>{{ $t('downloadFromAre') }}</span></button>
                    <button v-if="areModelFile && areModelFile.dataBase64" class="six columns" @click="uploadAREModel(action)"><i class="fas fa-upload"/> <span>{{ $t('uploadToAre') }}</span></button>
                </div>
            </div>
        </div>
        <div class="srow" v-if="!areModelSync">
            <div class="eight columns offset-by-four">
                <i class="fas fa-info-circle" />
                <span v-show="areModelFile && areModelFile.dataBase64">{{ $t('uploadTheSavedModelOrDownloadCurrent') }}</span>
                <span v-show="areModelFile && !areModelFile.dataBase64">{{ $t('downloadTheCurrentAreModelInOrderToDefine') }}</span>
            </div>
        </div>
        <div class="srow" v-if="areModelSync">
            <div class="four columns">
                <label class="normal-text" for="inputComponentId">{{ $t('component') }}</label>
            </div>
            <select class="eight columns" id="inputComponentId" v-model="action.componentId" @change="reloadPorts(action)">
                <option v-for="id in areComponentIds" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
        <div class="srow" v-if="areModelSync && areComponentPorts.length != 0">
            <div class="four columns offset-by-four">
                <label for="inputDataPortId" class="normal-text">{{ $t('sendDataToPort') }}</label>
                <select id="inputDataPortId" class="full-width" v-model="action.dataPortId">
                    <option value="">{{ $t('empty') }}</option>
                    <option v-for="id in areComponentPorts" :value="id">
                        {{id}}
                    </option>
                </select>
            </div>
            <div class="four columns">
                <label for="inputDataPortData" class="normal-text">{{ $t('dataToSend') }}</label>
                <input id="inputDataPortData" type="text" class="full-width" v-model="action.dataPortSendData"/>
            </div>
        </div>
        <div class="srow" v-if="areModelSync && areComponentEventPorts.length != 0">
            <div class="eight columns offset-by-four">
                <label for="inputeventPortId" class="normal-text">Event-Port</label>
                <select id="inputeventPortId" class="full-width" v-model="action.eventPortId">
                    <option value="">{{ $t('empty') }}</option>
                    <option v-for="id in areComponentEventPorts" :value="id">
                        {{id}}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
    import FileSaver from 'file-saver'
    import {areService} from './../../../js/service/areService'
    import {GridData} from "../../../js/model/GridData";
    import {AdditionalGridFile} from "../../../js/model/AdditionalGridFile";
    import {helpService} from "../../../js/service/helpService";
    import TestAreConnection from "./testAreConnection.vue";

    export default {
        props: ['action', 'gridData'],
        data: function () {
            return {
                loading: false,
                areComponentIds: [],
                areComponentPorts: [],
                areComponentEventPorts: [],
                areModelFile: null, //Object of Type AdditionalGridFile that represents the ARE Model for this action
                areModelSync: false
            }
        },
        components: {
            TestAreConnection
        },
        methods: {
            reloadAREModel(action) {
                var thiz = this;
                thiz.loading = true;
                areService.downloadDeployedModelBase64(action.areURL).then(base64Model => {
                    areService.getModelName(action.areURL).then(modelName => {
                        thiz.areModelFile.dataBase64 = base64Model;
                        thiz.areModelFile.fileName = modelName;
                        action.areModelGridFileName = modelName;
                        thiz.updateGridModelFile();
                        thiz.loading = false;
                        thiz.areModelSync = true;
                        thiz.reloadComponentIds(action);
                        thiz.reloadPorts(action)
                    });
                }).catch(() => {
                    thiz.areModelFile.dataBase64 = null;
                    thiz.updateGridModelFile();
                    thiz.loading = false;
                });
            },
            updateGridModelFile() {
                let setFile = false;
                this.gridData.additionalFiles = this.gridData.additionalFiles || [];
                for (let i = 0; i < this.gridData.additionalFiles.length; i++) {
                    if (this.action.areModelGridFileName && this.action.areModelGridFileName === this.gridData.additionalFiles[i].fileName) {
                        this.gridData.additionalFiles[i] = this.areModelFile;
                        setFile = true;
                    }
                }
                if (!setFile) {
                    this.gridData.additionalFiles.push(this.areModelFile);
                }
            },
            uploadAREModel(action) {
                var thiz = this;
                areService.uploadModelBase64(thiz.areModelFile.dataBase64, action.areURL).then(() => {
                    thiz.reloadComponentIds(action);
                    thiz.reloadPorts(action);
                    thiz.areModelSync = true;
                });
            },
            reloadComponentIds(action) {
                var thiz = this;
                areService.getRuntimeComponentIds(action.areURL).then(ids => {
                    thiz.areComponentIds = ids;
                });
            },
            reloadPorts(action) {
                var thiz = this;
                areService.getPossibleEvents(action.componentId, this.areModelFile.dataBase64, action.areURL).then(portIds => {
                    thiz.areComponentEventPorts = portIds;
                });
                areService.getComponentInputPortIds(action.componentId, action.areURL).then(inputPortIds => {
                    thiz.areComponentPorts = inputPortIds;
                });
            },
            downloadModelFile(additionalGridFile) {
                var blob = new Blob([window.atob(additionalGridFile.dataBase64)], {type: "text/plain;charset=utf-8"});
                var name = additionalGridFile.fileName.indexOf('.acs') != -1 ? additionalGridFile.fileName : additionalGridFile.fileName + '.acs';
                FileSaver.saveAs(blob, name);
            }
        },
        mounted () {
            this.action.areURL = this.action.areURL || areService.getRestURL();
            this.areModelFile = new GridData(this.gridData).getAdditionalFile(this.action.areModelGridFileName);
            if (!this.areModelFile) {
                this.areModelFile = new AdditionalGridFile();
            }
            helpService.setHelpLocation('05_actions', '#asterics-action');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    .nomargin {
        margin-top: 0;
    }

    .full-width {
        width: 100%;
    }

    .normal-text {
        font-weight: normal;
    }
</style>