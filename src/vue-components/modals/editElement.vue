<template>
    <base-modal :icon="icon" :title="title" @open="init" @keydown.ctrl.enter="save" @keydown.ctrl.right="nextFromKeyboard" @keydown.ctrl.left="editNext(true)" @keydown.ctrl.y="save(true)" @dragenter="preventDefault" @dragover="preventDefault" @drop="preventDefault" v-on="$listeners">
        <template #header-extra>
                        <edit-element-header :grid-element="originalGridElement"></edit-element-header>
        </template>
        <template #default>
                    <nav-tabs class="mb-3" :tab-labels="Object.keys(possibleTabs)" v-model="currentTab" @input="imageSearch = ''"></nav-tabs>
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
        </template>
        <template #footer-extra>
                            <div class="edit" v-if="gridElement">
                                <div v-if="editElementId">
                                    <button @click="editNext(true)" :title="$t('keyboardCtrlLeft')"><i class="fas fa-angle-double-left" aria-hidden="true"></i><span>{{ $t('okEditPrevious') }}</span></button>
                                    <button @click="editNext()" :title="$t('keyboardCtrlRight')"><span>{{ $t('okEditNext') }}</span><i class="fas fa-angle-double-right" aria-hidden="true"></i></button>
                                </div>
                                <div v-if="!editElementId">
                                    <button @click="addNext()" :title="$t('keyboardCtrlRight')"><i class="fas fa-plus" aria-hidden="true"></i><span>{{ $t('okAddAnother') }}</span></button>
                                </div>
                            </div>
        </template>
    </base-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {GridImage} from "../../js/model/GridImage";
    import {modalMixin} from "../mixins/modalMixin";
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
        props: ['editElementIdParam', 'gridDataId', 'gridInstance'],
        mixins: [modalMixin],
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
            };
        },
        computed: {
            title() {
                return this.editElementId ? this.$t('editGridItem') : this.$t('newGridItem');
            },
            icon() {
                return this.editElementId ? 'fas fa-edit' : 'fas fa-plus';
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
                    this.closeModal();
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
                        let newXYPos = gridData.getNewXYPos();
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
            }
        },
        mounted() {
            this.baseModal.$on('open', () => {
                this.editElementId = this.editElementIdParam;
                this.initInternal();
                helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            });
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
};
</script>

<style lang="scss" scoped>
.edit {
    flex-grow: 3;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    width: 100%;
    
    div {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-between;
        width: 100%;

        button {
            width: 100%;
            white-space: nowrap;
        }
    }
}

@media screen and (min-width: 992px) {
    .edit {
        margin-right: 3rem;

        div {
            flex-flow: row nowrap;

        }
    }
}
</style>
