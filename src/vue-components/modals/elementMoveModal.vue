<template>
    <base-modal icon="fas fa-file-export" :title="$t('moveGridElement')" @open="init" @keyup.ctrl.enter="save" v-on="$listeners">
                    <template #header-extra>
                        <edit-element-header :grid-element="gridElement"></edit-element-header>
                    </template>
                    <template #default v-if="gridElement">
                        <grid-selector class="mt-4" v-model="selectedGrid" :exclude-id="gridId" :include-global="true" :select-label="i18nService.t('moveElementToGrid')"></grid-selector>
                        <div class="srow">
                            <input id="moveAll" type="checkbox" v-model="moveAllElements"/>
                            <label for="moveAll">{{ $t('moveAllElementsToThisGrid') }}</label>
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
    import {helpService} from "../../js/service/helpService.js";
    import {GridElement} from "../../js/model/GridElement.js";

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
                imageUtil: imageUtil
            }
        },
        methods: {
            save() {
                if (!this.selectedGrid) {
                    return;
                }
                this.saveInternal().then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                    this.closeModal();
                });
            },
            saveInternal() {
                return dataService.getGrid(this.selectedGrid.id).then(targetGrid => {
                    let moveElements = this.moveAllElements ? this.gridData.gridElements : [this.gridElement];
                    let targetGridIds = targetGrid.gridElements.map(e => e.id);
                    moveElements.forEach(element => {
                        let isBigElement = element.width > 1 || element.height > 1;
                        let newPosition = targetGrid.getNewXYPos(isBigElement);
                        element.x = newPosition.x;
                        element.y = newPosition.y;
                        if (targetGridIds.includes(element.id)) {
                            element.id = new GridElement().id;
                        }
                        targetGrid.gridElements.push(element);
                    });
                    this.gridData.gridElements = this.moveAllElements ? [] : this.gridData.gridElements.filter(e => e.id !== this.gridElement.id);

                    let promises = [];
                    promises.push(dataService.saveGrid(this.gridData));
                    promises.push(dataService.saveGrid(targetGrid));
                    return Promise.all(promises);
                });
            },
        init() {
            dataService.getGrid(this.gridId).then(gridData => {
                this.gridData = JSON.parse(JSON.stringify(gridData));
                this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
            });
            helpService.setHelpLocation('03_appearance_layout', '#editing-grid-elements');
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