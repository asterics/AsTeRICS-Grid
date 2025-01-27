<template>
    <div class="modal" @dragenter="preventDefault" @dragover="preventDefault" @drop="preventDefault">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()" @keydown.ctrl.right="nextFromKeyboard()" @keydown.ctrl.left="editNext(true)" @keydown.ctrl.y="save(true)">
                    <div class="modal-header">
                        <edit-element-header :grid-element="originalGridElement" :header="editElementId ? $t('editGridItem') : $t('newGridItem')" :close-fn="close" :open-help-fn="openHelp"></edit-element-header>
                    </div>

                    <nav-tabs class="mb-5" :tab-labels="Object.keys(possibleTabs)" v-model="currentTab" @input="imageSearch = ''"></nav-tabs>

                    <div class="modal-body mt-2" v-if="gridElement">
                        <div v-if="currentTab === TABS.TAB_GENERAL">
                            <edit-element-general v-if="gridElement.type === GridElement.ELEMENT_TYPE_NORMAL" :grid-element="gridElement" @searchImage="toImageSearch"></edit-element-general>
                            <edit-element-youtube v-if="gridElement.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="gridElement"></edit-element-youtube>
                            <edit-element-collect v-if="gridElement.type === GridElement.ELEMENT_TYPE_COLLECT" :grid-element="gridElement"></edit-element-collect>
                        </div>
                        <edit-element-image v-if="currentTab === TABS.TAB_IMAGE" :grid-element="gridElement" :grid-data="gridData" :image-search="imageSearch"></edit-element-image>
                        <edit-element-word-forms v-if="currentTab === TABS.TAB_WORDFORMS" :grid-element="gridElement" :grid-data="gridData" @reloadData="initInternal(true)"></edit-element-word-forms>
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
    import EditElementYoutube from "./editElementYoutube.vue";
    import {i18nService} from "../../js/service/i18nService.js";
    import EditElementCollect from "./editElementCollect.vue";
    import EditElementHeader from "../components/editElementHeader.vue";
    import EditElementWordForms from "./editElementWordForms.vue";

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_IMAGE = 'TAB_IMAGE';
    const TAB_WORDFORMS = 'TAB_WORDFORMS';
    const TAB_ACTIONS = 'TAB_ACTIONS';
    const TABS = {TAB_GENERAL, TAB_IMAGE, TAB_WORDFORMS,TAB_ACTIONS};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'undoService', 'newPosition'],
        components: {
            EditElementWordForms,
            EditElementHeader,
            EditElementCollect,
            NavTabs, EditElementGeneral, EditElementImage, EditElementActions, EditElementYoutube
        },
        data: function () {
            return {
                gridData: null,
                originalGridData: null,
                gridElement: null,
                originalGridElement: null,
                editElementId: null,
                TABS: TABS,
                possibleTabs: {},
                currentTab: TAB_GENERAL,
                imageSearch: null,
                GridElement: GridElement
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
                    if (savedSomething) {
                        this.$emit('reload', this.gridData);
                    }
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
                        thiz.undoService.updateGrid(thiz.gridData).then(updated => {
                            resolve(updated);
                        });
                    } else {
                        resolve(false);
                    }
                });
            },
            initInternal(dontReset) {
                let thiz = this;
                if (!dontReset) thiz.resetInternal();
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
                        let newXYPos = this.newPosition || gridData.getNewXYPos();
                        log.debug('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                        thiz.gridElement = JSON.parse(JSON.stringify(new GridElement({
                            x: newXYPos.x,
                            y: newXYPos.y
                        })));
                        thiz.gridData.gridElements.push(thiz.gridElement);
                    }
                    if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_NORMAL) {
                        this.possibleTabs = this.TABS;
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_YT_PLAYER) {
                        this.possibleTabs = {TAB_GENERAL, TAB_ACTIONS};
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_COLLECT) {
                        this.possibleTabs = {TAB_GENERAL, TAB_ACTIONS};
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                        this.possibleTabs = {TAB_ACTIONS};
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
            },
            close() {
                this.$emit('close');
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