<template>
    <div>
        <div class="row">
            <div class="two columns">
                <label for="inputAREURI" class="normal-text">ARE URL</label>
            </div>
            <div class="ten columns">
                <div class="row nomargin">
                    <input id="inputAREURI" class="six columns" type="text" v-model="action.areURL" @change="fixAreUrl()"/>
                    <div class="six columns">
                        <button @click="testAREUrl(action)" style="width: 70%"><i class="fas fa-bolt"/> <span data-i18n="">Test URL // URL testen</span></button>
                        <span class="spaced" v-show="areConnected === undefined"><i class="fas fa-spinner fa-spin"/></span>
                        <span class="spaced" v-show="areConnected" style="color: green"><i class="fas fa-check"/></span>
                        <span class="spaced" v-show="areConnected == false" style="color: red"><i class="fas fa-times"/></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="two columns">
                <label class="normal-text">ARE Model</label>
            </div>
            <div class="ten columns">
                <div class="row nomargin">
                    <div class="twelve columns">
                        <span v-show="loading" data-i18n="">Loading Model from ARE... // Lade Modell von ARE...</span>
                        <span v-show="!loading && areModelSync && areModelFile && !areModelFile.dataBase64" data-i18n="">Could not load Model from ARE! // Konnte Modell nicht von ARE laden!</span>
                        <span v-show="!loading && !areModelSync && areModelFile && !areModelFile.dataBase64" data-i18n="">(no ARE model) // (kein ARE Modell)</span>
                        <span v-if="!loading && areModelFile && areModelFile.dataBase64">
                            <a href="javascript:void(0);" @click="downloadModelFile(areModelFile)">{{areModelFile.fileName}}</a>
                        </span>
                    </div>
                </div>
                <div class="row">
                    <button class="six columns" @click="reloadAREModel(action)"><i class="fas fa-download"/> <span data-i18n="">Download from ARE // Download von ARE</span></button>
                    <button v-if="areModelFile && areModelFile.dataBase64" class="six columns" @click="uploadAREModel(action)"><i class="fas fa-upload"/> <span data-i18n="">Upload to ARE // Upload zu ARE</span></button>
                </div>
            </div>
        </div>
        <div class="row" v-if="!areModelSync">
            <div class="ten columns offset-by-two">
                <i class="fas fa-info-circle" />
                <span v-show="areModelFile && areModelFile.dataBase64" data-i18n="">Upload the saved model or download current ARE model in order to define the action. // Laden Sie das gespeicherte Modell hoch oder das aktuelle ARE Modell herunter um die Aktion zu definieren.</span>
                <span v-show="areModelFile && !areModelFile.dataBase64" data-i18n="">Download the current ARE model in order to define the action. // Laden Sie das aktuelle ARE Modell herunter um die Aktion zu definieren.</span>
            </div>
        </div>
        <div class="row" v-if="areModelSync">
            <div class="two columns">
                <label class="normal-text" for="inputComponentId" data-i18n="">Component // Komponente</label>
            </div>
            <select class="five columns" id="inputComponentId" v-model="action.componentId" @change="reloadPorts(action)">
                <option v-for="id in areComponentIds" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
        <div class="row" v-if="areModelSync && areComponentPorts.length != 0">
            <div class="two columns">
                <label for="inputDataPortId" class="normal-text" data-i18n="">
                    <span>Send data <span class="show-mobile">to port</span></span>
                    <span>Sende Daten <span class="show-mobile">zu Port</span></span>
                </label>
            </div>
            <div class="five columns">
                <label for="inputDataPortId" class="normal-text hide-mobile">Port</label>
                <select id="inputDataPortId" class="full-width" v-model="action.dataPortId">
                    <option v-for="id in areComponentPorts" :value="id">
                        {{id}}
                    </option>
                </select>
            </div>
            <div class="five columns">
                <label for="inputDataPortData" class="normal-text" data-i18n="">Data // Daten</label>
                <input id="inputDataPortData" type="text" class="full-width" v-model="action.dataPortSendData"/>
            </div>
        </div>
        <div class="row" v-if="areModelSync && areComponentEventPorts.length != 0">
            <div class="two columns">
                <label for="inputeventPortId" class="normal-text" data-i18n="">
                    <span>Trigger event <span class="show-mobile">on event port</span></span>
                    <span>Event triggern <span class="show-mobile">auf Event-Port</span></span>
                </label>
            </div>
            <div class="five columns">
                <label for="inputeventPortId" class="normal-text hide-mobile">Event-Port</label>
                <select id="inputeventPortId" class="full-width" v-model="action.eventPortId">
                    <option v-for="id in areComponentEventPorts" :value="id">
                        {{id}}
                    </option>
                </select>
            </div>
        </div>
        <div class="row">
            <button class="six columns" @click="testAction(action)"><i class="fas fa-bolt"/> <span data-i18n="">Test action // Aktion Testen</span></button>
            <button class="six columns" @click="endEditAction()"><i class="fas fa-check"/> <span>OK</span></button>
        </div>
    </div>
</template>

<script>
    import FileSaver from 'file-saver'
    import {actionService} from './../../../js/service/actionService'
    import {areService} from './../../../js/service/areService'
    import {i18nService} from "../../../js/service/i18nService";
    import './../../../css/modal.css';
    import {GridData} from "../../../js/model/GridData";
    import {AdditionalGridFile} from "../../../js/model/AdditionalGridFile";
    import {helpService} from "../../../js/service/helpService";

    export default {
        props: ['action', 'gridData', 'modelFile','setGridFileFn', 'endEditFn'],
        data: function () {
            return {
                loading: false,
                areConnected: null,
                areComponentIds: [],
                areComponentPorts: [],
                areComponentEventPorts: [],
                areModelFile: null, //Object of Type AdditionalGridFile that represents the ARE Model for this action
                areModelSync: false
            }
        },
        methods: {
            endEditAction () {
                this.endEditFn();
            },
            testAction (action) {
                let props = this.areModelFile.dataBase64 ? {additionalFiles: [this.areModelFile]} : {};
                actionService.testAction(null, action, new GridData(props, this.gridData));
            },
            reloadAREModel(action) {
                var thiz = this;
                thiz.loading = true;
                areService.downloadDeployedModelBase64(action.areURL).then(base64Model => {
                    areService.getModelName(action.areURL).then(modelName => {
                        thiz.areModelFile.dataBase64 = base64Model;
                        thiz.areModelFile.fileName = modelName;
                        action.areModelGridFileName = modelName;
                        thiz.setGridFileFn(thiz.action, thiz.areModelFile);
                        thiz.loading = false;
                        thiz.areModelSync = true;
                        thiz.reloadComponentIds(action);
                        thiz.reloadPorts(action)
                    });
                }).catch(() => {
                    thiz.areModelFile.dataBase64 = null;
                    thiz.setGridFileFn(thiz.action, null);
                    thiz.loading = false;
                });
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
            testAREUrl(action) {
                var thiz = this;
                action.areURL = areService.getRestURL(action.areURL);
                thiz.areConnected = undefined;
                areService.getModelName(action.areURL).then(() => {
                    thiz.areConnected = true;
                }).catch(() => {
                    thiz.areConnected = false;
                });
            },
            downloadModelFile(additionalGridFile) {
                var blob = new Blob([window.atob(additionalGridFile.dataBase64)], {type: "text/plain;charset=utf-8"});
                var name = additionalGridFile.fileName.indexOf('.acs') != -1 ? additionalGridFile.fileName : additionalGridFile.fileName + '.acs';
                FileSaver.saveAs(blob, name);
            },
            fixAreUrl() {
                this.action.areURL = areService.getRestURL(this.action.areURL);
            }
        },
        mounted () {
            this.action.areURL = this.action.areURL || areService.getRestURL();
            if(this.modelFile) { //model file parameter
                this.areModelFile = this.modelFile;
            } else {
                this.areModelFile = new GridData(this.gridData).getAdditionalFile(this.action.areModelGridFileName);
                this.setGridFileFn(this.action, this.areModelFile);
            }
            if(!this.areModelFile) {
                this.areModelFile = new AdditionalGridFile();
            }
            helpService.setHelpLocation('05_actions', '#asterics-action');
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .row {
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