<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('editCollect') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <label for="selectMode" class="four columns">{{ $t('collectMode') }}</label>
                            <select v-if="editElement" class="four columns" id="selectMode" type="checkbox" v-model="editElement.mode">
                                <option v-for="mode in GridElementCollect.MODES" :value="mode">{{ $t(mode) }}</option>
                            </select>
                        </div>
                        <div class="row">
                            <label for="imageHeight" class="four columns">{{ $t('heightOfCollectedImages') }}</label>
                            <input v-if="editElement" class="four columns" id="imageHeight" type="number" min="50" max="100" :disabled="!editElement.showLabels" v-model="editElement.imageHeightPercentage"/>
                        </div>
                        <div class="row">
                            <input v-if="editElement" id="showLabel" type="checkbox" v-model="editElement.showLabels"/>
                            <label for="showLabel">{{ $t('showLabelsOfCollectedImages') }}</label>
                        </div>
                        <div class="row">
                            <input v-if="editElement" id="useSingleLine" type="checkbox" v-model="editElement.singleLine"/>
                            <label for="useSingleLine">{{ $t('useHorizontalScrollbarIfElementsDontFit') }}</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button @click="$emit('close')" :title="$t('keyboardEsc')" class="four columns offset-by-four">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" :title="$t('keyboardCtrlEnter')" class="four columns">
                                <i class="fas fa-check"/> <span>{{ $t('save') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService.js";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";

    export default {
        props: ['gridData', 'editElementId'],
        data: function () {
            return {
                editElement: null,
                GridElementCollect: GridElementCollect
            }
        },
        methods: {
            save() {
                let grid = gridUtil.updateOrAddGridElement(this.gridData, this.editElement);
                dataService.saveGrid(grid).then(() => {
                    this.$emit('close');
                    this.$emit('reload');
                });
            }
        },
        mounted() {
            this.editElement = JSON.parse(JSON.stringify(this.gridData.gridElements.filter(e => e.id === this.editElementId)[0]));
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>