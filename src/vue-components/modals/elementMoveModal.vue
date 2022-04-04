<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('moveGridElement') }}
                        </h1>
                    </div>

                    <div class="modal-body container" v-if="otherGrids && gridElement && selectedGrid">
                        <div class="srow">
                            <label class="four columns" for="moveGrid">{{i18nService.t('moveElementToGrid', i18nService.getTranslation(this.gridElement.label))}}</label>
                            <select class="four columns" id="moveGrid" v-model="selectedGrid" style="margin-bottom: 1em">
                                <option v-for="grid in otherGrids" :value="grid">{{grid.label | extractTranslation}}</option>
                            </select>

                        </div>
                        <div class="srow">
                            <div class="four columns">
                                <img :src="selectedGrid.thumbnail ? selectedGrid.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; border: 1px solid lightgray"/>
                            </div>
                            <div class="four columns">
                                <button @click="prev" style="width: 49%"><i class="fas fa-arrow-left"></i> <span>{{ $t('back') }}</span></button>
                                <button @click="next" style="width: 49%"><span>{{ $t('next') }}</span> <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                        <div class="srow">
                            <input id="moveAll" type="checkbox" v-model="moveAllElements"/>
                            <label for="moveAll">{{ $t('moveAllElementsToThisGrid') }}</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                            </button>
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

    export default {
        props: ['gridId', 'gridElementId'],
        data: function () {
            return {
                gridData: null,
                gridElement: null,
                otherGrids: null,
                selectedGrid: null,
                moveAllElements: false,
                i18nService: i18nService,
                imageUtil: imageUtil
            }
        },
        methods: {
            prev() {
                let newSelected = null;
                this.otherGrids.forEach((grid, index) => {
                    if (this.selectedGrid === grid) {
                        let newIndex = (index - 1) < 0 ? this.otherGrids.length - 1 : index - 1;
                        newSelected = this.otherGrids[newIndex];
                    }
                });
                this.selectedGrid = newSelected;
            },
            next() {
                let newSelected = null;
                this.otherGrids.forEach((grid, index) => {
                    if (this.selectedGrid === grid) {
                        let newIndex = (index + 1) < this.otherGrids.length ? index + 1 : 0;
                        newSelected = this.otherGrids[newIndex];
                    }
                });
                this.selectedGrid = newSelected;
            },
            save() {
                this.saveInternal().then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            },
            saveInternal() {
                return dataService.getGrid(this.selectedGrid.id).then(targetGrid => {
                    let moveElements = this.moveAllElements ? this.gridData.gridElements : [this.gridElement];
                    moveElements.forEach(element => {
                        let isBigElement = element.width > 1 || element.height > 1;
                        let newPosition = targetGrid.getNewXYPos(isBigElement);
                        element.x = newPosition.x;
                        element.y = newPosition.y;
                        targetGrid.gridElements.push(element);
                    });
                    this.gridData.gridElements = this.moveAllElements ? [] : this.gridData.gridElements.filter(e => e.id !== this.gridElement.id);

                    let promises = [];
                    promises.push(dataService.saveGrid(this.gridData));
                    promises.push(dataService.saveGrid(targetGrid));
                    return Promise.all(promises);
                });
            }
        },
        mounted() {
            dataService.getGrid(this.gridId).then(gridData => {
                this.gridData = JSON.parse(JSON.stringify(gridData));
                this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
            });
            dataService.getGrids(false, true).then(grids => {
                this.otherGrids = JSON.parse(JSON.stringify(grids)).filter(grid => grid.id !== this.gridId);
                this.selectedGrid = this.otherGrids[0];
            })
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