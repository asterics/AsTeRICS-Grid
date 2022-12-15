<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" :aria-label="$t('navigateToOtherGrid')" aria-modal="true" role="dialog" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <div class="modal-header">
                        <edit-element-header :grid-element="gridElement" :header="$t('navigateToOtherGrid')" :close-fn="close" :open-help-fn="openHelp"></edit-element-header>
                    </div>

                    <div class="modal-body container-fluid px-0" v-if="gridElement">
                        <grid-selector class="mt-4" v-model="selectedGrid" :exclude-id="gridId" :select-label="i18nService.t('navigateToGrid')" :additional-select-options="[NAV_CREATE_NEW_GRID]"></grid-selector>

                        <div class="row mt-3" v-if="selectedGrid === NAV_CREATE_NEW_GRID">
                            <label for="gridName" class="col-12">New grid name</label>
                            <div class="col-12 col-md-5">
                                <input id="gridName" v-model="newName" @change="newName = modelUtil.getNewName(newName, existingGridNames)" autocomplete="off" v-focus class="col-12" type="text"/>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer container-fluid px-0">
                        <div class="row">
                            <div class="col-12 col-md-6">
                                <button class="col-12" @click="$emit('close')" :title="$t('keyboardEsc')">
                                    <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                                </button>
                            </div>
                            <div class="col-12 col-md-6">
                                <button class="col-12" @click="save()" :disabled="selectedGrid === NAV_CREATE_NEW_GRID && !newName" :title="$t('keyboardCtrlEnter')">
                                    <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {i18nService} from "../../js/service/i18nService";
import './../../css/modal.css';
import {dataService} from "../../js/service/data/dataService";
import {imageUtil} from "../../js/util/imageUtil";
import GridSelector from "../components/gridSelector.vue";
import EditElementHeader from "../components/editElementHeader.vue";
import {helpService} from "../../js/service/helpService.js";
import {modelUtil} from "../../js/util/modelUtil.js";
import {GridActionNavigate} from "../../js/model/GridActionNavigate.js";
import {GridData} from "../../js/model/GridData.js";

export default {
    components: {EditElementHeader, GridSelector},
    props: ['gridId', 'gridElementId'],
    data: function () {
        return {
            gridData: null,
            gridElement: null,
            selectedGrid: null,
            moveAllElements: false,
            i18nService: i18nService,
            imageUtil: imageUtil,
            existingGridNames: [],
            newName: '',
            modelUtil: modelUtil,
            NAV_CREATE_NEW_GRID: "NAV_CREATE_NEW_GRID"
        }
    },
    methods: {
        addGrid() {

        },
        save() {
            if (this.selectedGrid === this.NAV_CREATE_NEW_GRID && !this.newName) {
                return;
            }
            this.saveInternal().then(() => {
                this.$emit('reload');
                this.$emit('close');
            });
        },
        async saveInternal() {
            let gridId = null;
            let label = null;
            if (this.selectedGrid === this.NAV_CREATE_NEW_GRID) {
                let newGrid = new GridData({
                    label: i18nService.getTranslationObject(this.newName),
                    gridElements: []
                });
                await dataService.saveGrid(newGrid);
                gridId = newGrid.id;
                label = this.newName;
            } else {
                gridId = this.selectedGrid.id;
                label = i18nService.getTranslation(this.selectedGrid.label);
            }
            this.gridElement.actions = this.gridElement.actions.filter(action => action.modelName !== GridActionNavigate.getModelName());
            let navAction = new GridActionNavigate({
                toGridId: gridId
            });
            if (!i18nService.getTranslation(this.gridElement.label)) {
                this.gridElement.label = this.gridElement.label || {};
                this.gridElement.label[i18nService.getContentLang()] = label;
            }
            this.gridElement.actions.push(navAction);
            await dataService.saveGrid(this.gridData);
        },
        openHelp() {
            helpService.openHelp();
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
        dataService.getGrid(this.gridId).then(gridData => {
            this.gridData = JSON.parse(JSON.stringify(gridData));
            this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
        });
        let grids = await dataService.getGrids(false);
        this.existingGridNames = grids.map(grid => i18nService.getTranslation(grid.label));
    }
}
</script>

<style scoped>
.modal-body {
    margin-top: 0;
}

.srow {
    margin-top: 1em;
}
</style>