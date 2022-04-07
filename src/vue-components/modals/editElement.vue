<template>
    <div class="modal" @dragenter="preventDefault" @dragover="preventDefault" @drop="preventDefault">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()" @keydown.ctrl.right="nextFromKeyboard()" @keydown.ctrl.left="editNext(true)" @keydown.ctrl.y="save(true)">
                    <div class="container-fluid px-0 mb-5">
                        <div class="row">
                            <div class="modal-header col-8 col-sm-10 col-md-5 order-md-1">
                                <h1 v-if="editElementId" name="header" class="inline">
                                    {{ $t('editGridItem') }}
                                </h1>
                                <h1 v-if="!editElementId" name="header" class="inline">
                                    {{ $t('newGridItem') }}
                                </h1>
                            </div>
                            <a class="col-2 col-sm-1 col-md black order-md-3" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                            <a class="col-2 col-sm-1 col-md black order-md-4" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                            <div class="col-12 col-md-5 d-flex align-items-center order-md-2" v-if="originalGridElement">
                                <img height="30" :src="originalGridElement.image.data"/>
                                <span class="mx-2">{{ originalGridElement.label | extractTranslation }}</span>
                            </div>
                        </div>
                    </div>

                    <nav-tabs class="mb-3" :tab-labels="Object.keys(TABS)" v-model="currentTab" @input="imageSearch = ''"></nav-tabs>

                    <div class="modal-body mt-2" v-if="gridElement">
                        <edit-element-general v-if="currentTab === TABS.TAB_GENERAL" :grid-element="gridElement" @searchImage="toImageSearch"></edit-element-general>
                        <edit-element-image v-if="currentTab === TABS.TAB_IMAGE" :grid-element="gridElement" :grid-data="gridData" :image-search="imageSearch"></edit-element-image>
                        <edit-element-actions v-if="currentTab === TABS.TAB_ACTIONS" :grid-element="gridElement" :grid-data="gridData"></edit-element-actions>
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container" v-if="gridElement">
                            <div class="srow">
                                <button @click="$emit('close')" :title="$t('keyboardEsc')" class="four columns offset-by-four">
                                    <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                                </button>
                                <button @click="save()" :title="$t('keyboardCtrlEnter')" class="four columns">
                                    <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                                </button>
                            </div>
                            <div class="hide-mobile srow">
                                <div v-if="editElementId">
                                    <button @click="editNext(true)" :title="$t('keyboardCtrlLeft')" class="four columns offset-by-four"><i class="fas fa-angle-double-left"/> <span>{{ $t('okEditPrevious') }}</span></button>
                                    <button @click="editNext()" :title="$t('keyboardCtrlRight')" class="four columns"><span>{{ $t('okEditNext') }}</span> <i class="fas fa-angle-double-right"/></button>
                                </div>
                                <div v-if="!editElementId">
                                    <button @click="addNext()" :title="$t('keyboardCtrlRight')" class="four columns offset-by-eight"><i class="fas fa-plus"/> <span>{{ $t('okAddAnother') }}</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {GridImage} from "../../js/model/GridImage";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import {util} from "../../js/util/util";
    import NavTabs from "../components/nav-tabs.vue";
    import EditElementGeneral from "./editElementGeneral.vue";
    import EditElementImage from "./editElementImage.vue";
    import EditElementActions from "./editElementActions.vue";
    import {i18nService} from "../../js/service/i18nService.js";

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_IMAGE = 'TAB_IMAGE';
    const TAB_ACTIONS = 'TAB_ACTIONS';
    const TABS = {TAB_GENERAL, TAB_IMAGE, TAB_ACTIONS};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'gridInstance'],
        components: {
            NavTabs, EditElementGeneral, EditElementImage, EditElementActions
        },
        data: function () {
            return {
                gridData: null,
                originalGridData: null,
                gridElement: null,
                originalGridElement: null,
                editElementId: null,
                TABS: TABS,
                currentTab: TAB_GENERAL,
                imageSearch: null
            }
        },
        methods: {
            toImageSearch() {
                this.imageSearch = i18nService.getTranslation(this.gridElement.label);
                this.currentTab = TABS.TAB_IMAGE;
            },
            save(toActions) {
                this.saveInternal().then((savedSomething) => {
                    this.$emit('close');
                    if (savedSomething && !this.editElementId) {
                        this.$emit('mark', this.gridElement.id);
                    }
                    if (toActions) {
                        this.$emit('actions', this.gridElement.id);
                    }
                });
            },
            addNext() {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                if (!thiz.editElementId) return;

                thiz.saveInternal().then(() => {
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection);
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            nextFromKeyboard() {
                if (this.editElementId) {
                    this.editNext();
                } else {
                    this.addNext();
                }
            },
            saveInternal() {
                let thiz = this;
                return new Promise(resolve => {
                    if (thiz.gridData && JSON.stringify(thiz.originalGridData) !== JSON.stringify(thiz.gridData)) {
                        thiz.gridInstance.updateGridWithUndo(thiz.gridData).then(updated => {
                            resolve(updated);
                        });
                    } else {
                        resolve(false);
                    }
                });
            },
            initInternal() {
                let thiz = this;
                thiz.resetInternal();
                dataService.getGrid(thiz.gridDataId).then(gridData => {
                    thiz.gridData = JSON.parse(JSON.stringify(gridData));
                    thiz.originalGridData = JSON.parse(JSON.stringify(gridData));
                    if (thiz.editElementId) {
                        thiz.gridElement = thiz.gridData.gridElements.filter(e => e.id === thiz.editElementId)[0];
                        if (!thiz.gridElement.image) {
                            thiz.gridElement.image = JSON.parse(JSON.stringify(new GridImage()));
                        }
                        thiz.gridElement.label = util.isString(thiz.gridElement.label) ? {} : thiz.gridElement.label;
                    } else {
                        let newXYPos = gridData.getNewXYPos();
                        log.debug('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                        thiz.gridElement = JSON.parse(JSON.stringify(new GridElement({
                            x: newXYPos.x,
                            y: newXYPos.y
                        })));
                        thiz.gridData.gridElements.push(thiz.gridElement);
                    }
                    thiz.originalGridElement = JSON.parse(JSON.stringify(thiz.gridElement));
                });
            },
            resetInternal() {
                this.gridElement = this.originalGridElement = null;
            },
            preventDefault(event) {
                event.preventDefault();
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            this.editElementId = this.editElementIdParam;
            this.initInternal();
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.modal-container {
    min-height: 50vh;
}

.srow {
    margin-top: 1em;
}
</style>