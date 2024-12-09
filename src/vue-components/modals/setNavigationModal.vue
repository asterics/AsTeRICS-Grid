<template>
    <base-modal icon="fas fa-arrow-right" :title="$t('navigateToOtherGrid')" @open="init" @keyup.ctrl.enter="save" @ok="save" v-on="$listeners">
                    <template #header-extra>
                        <edit-element-header :grid-element="gridElement"></edit-element-header>
                    </template>
                    <template #default v-if="gridElement">
                        <grid-selector v-model="selectedGrid" :exclude-id="gridId" :select-label="i18nService.t('navigateToGrid')" :additional-select-options="[NAV_CREATE_NEW_GRID]"></grid-selector>
                        <div v-if="selectedGrid === NAV_CREATE_NEW_GRID">
                            <label for="gridName">{{ $t('newGridName') }}</label>
                            <div>
                                <input id="gridName" v-model="newName" @change="newName = modelUtil.getNewName(newName, existingGridNames)" autocomplete="off" class="col-12" type="text"/>
                            </div>
                        </div>
                    </template>
    </base-modal>
</template>

<script>
import {i18nService} from "../../js/service/i18nService";
import {modalMixin} from "../mixins/modalMixin";
import {dataService} from "../../js/service/data/dataService";
import {imageUtil} from "../../js/util/imageUtil";
import GridSelector from "../components/gridSelector.vue";
import EditElementHeader from "../components/editElementHeader.vue";
import {modelUtil} from "../../js/util/modelUtil.js";
import {GridActionNavigate} from "../../js/model/GridActionNavigate.js";
import {GridData} from "../../js/model/GridData.js";

export default {
    components: {EditElementHeader, GridSelector},
    props: ['gridId', 'gridElementId'],
    mixins: [modalMixin],
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
                this.closeModal();
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
                toGridId: gridId,
                navType: GridActionNavigate.NAV_TYPES.TO_GRID
            });
            if (!i18nService.getTranslation(this.gridElement.label)) {
                this.gridElement.label = this.gridElement.label || {};
                this.gridElement.label[i18nService.getContentLang()] = label;
            }
            this.gridElement.actions.push(navAction);
            await dataService.saveGrid(this.gridData);
        },
    async init() {
        dataService.getGrid(this.gridId).then(gridData => {
            this.gridData = JSON.parse(JSON.stringify(gridData));
            this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
        });
        let grids = await dataService.getGrids(false);
        this.existingGridNames = grids.map(grid => i18nService.getTranslation(grid.label));
        helpService.setHelpLocation('03_appearance_layout', '#edit-grid-item-modal');
    }
    },
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