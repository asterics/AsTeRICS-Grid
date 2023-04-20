<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <div class="modal-header">
                        <edit-element-header :grid-element="gridElement" :header="$t('moveGridElement')" :close-fn="close" :open-help-fn="openHelp"></edit-element-header>
                    </div>

                    <div class="modal-body container-fluid px-0" v-if="gridElement">
                        <grid-selector class="mt-4" v-model="selectedGrid" :exclude-id="gridId" :select-label="i18nService.t('moveElementToGrid')"></grid-selector>

                        <div class="srow">
                            <input id="moveAll" type="checkbox" v-model="moveAllElements"/>
                            <label for="moveAll">{{ $t('moveAllElementsToThisGrid') }}</label>
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
                                <button class="col-12" @click="save()" :disabled="!selectedGrid" :title="$t('keyboardCtrlEnter')">
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
    import {GridElement} from "../../js/model/GridElement.js";

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
            openHelp() {
                helpService.openHelp();
            },
            close() {
                this.$emit('close');
            }
        },
        mounted() {
            dataService.getGrid(this.gridId).then(gridData => {
                this.gridData = JSON.parse(JSON.stringify(gridData));
                this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
            });
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