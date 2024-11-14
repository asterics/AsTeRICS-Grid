<template>
    <modal :title="$t('moveGridElement')" :help-fn="openHelp">
        <template #header>
            <edit-element-header :grid-element="gridElement" :header="$t('moveGridElement')" :close-fn="close" :open-help-fn="openHelp"></edit-element-header>
        </template>
        <template #default>
            <grid-selector class="mt-4" v-model="selectedGrid" :exclude-id="gridId" :include-global="true" :select-label="i18nService.t('moveElementToGrid')"></grid-selector>

            <div class="srow">
                <input id="moveAll" type="checkbox" v-model="moveAllElements"/>
                <label for="moveAll">{{ $t('moveAllElementsToThisGrid') }}</label>
            </div>
        </template>
        <template #ok-button>
            <button
                @click="save"
                @keydown.ctrl.enter="save"
                :aria-label="$t('keyboardCtrlEnter')"
                :title="$t('keyboardCtrlEnter')"
                :disabled="!selectedGrid"
                >
                    <i class="fas fa-check" aria-hidden="true"></i>
                    {{ $t('ok') }}
            </button>
        </template>
    </modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import Modal from "./modal.vue"
    import { modalMixin } from "../mixins/modalMixin.js";
    import {dataService} from "../../js/service/data/dataService";
    import {imageUtil} from "../../js/util/imageUtil";
    import GridSelector from "../components/gridSelector.vue";
    import EditElementHeader from "../components/editElementHeader.vue";
    import {helpService} from "../../js/service/helpService.js";
    import {GridElement} from "../../js/model/GridElement.js";

    export default {
        components: {Modal, EditElementHeader, GridSelector},
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
        computed: {
            gridId() {
                return this.$store.state.gridData?.id;
            },
            gridElementId() {
                return this.$store.state.editElementId;
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