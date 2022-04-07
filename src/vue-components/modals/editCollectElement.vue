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
                        <div class="srow">
                            <label for="selectMode" class="five columns">{{ $t('collectMode') }}</label>
                            <select v-if="editElement" class="four columns" id="selectMode" type="checkbox" v-model="editElement.mode">
                                <option v-for="mode in GridElementCollect.MODES" :value="mode">{{ $t(mode) }}</option>
                            </select>
                        </div>
                        <div class="srow">
                            <label for="imageHeight" class="five columns">{{ $t('heightOfCollectedImages') }}</label>
                            <input v-if="editElement" class="four columns" id="imageHeight" type="number" min="50" max="100" :disabled="!editElement.showLabels || !autoOrSeparatedMode" v-model.number="editElement.imageHeightPercentage"/>
                        </div>
                        <div class="srow">
                            <label for="singleTextElemFactor" class="five columns">{{ $t('factorForFontSizeOfOnlytextElements') }}</label>
                            <input v-if="editElement" class="four columns" id="singleTextElemFactor" type="number" min="0" max="5" step="0.1" :disabled="!autoOrSeparatedMode" v-model.number="editElement.textElemSizeFactor"/>
                        </div>
                        <div class="srow">
                            <input v-if="editElement" id="showLabel" type="checkbox" v-model="editElement.showLabels" :disabled="!autoOrSeparatedMode"/>
                            <label for="showLabel">{{ $t('showLabelsOfCollectedImages') }}</label>
                        </div>
                        <div class="srow">
                            <input v-if="editElement" id="useSingleLine" type="checkbox" v-model="editElement.singleLine" :disabled="!autoOrSeparatedMode"/>
                            <label for="useSingleLine">{{ $t('useHorizontalScrollbarIfElementsDontFit') }}</label>
                        </div>
                        <div class="srow">
                            <input v-if="editElement" id="convertToLowercase" type="checkbox" v-model="editElement.convertToLowercase"/>
                            <label for="convertToLowercase">{{ $t('convertUppercaseKeyboardLettersToLowercase') }}</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
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
        computed: {
            autoOrSeparatedMode: function () {
                return [GridElementCollect.MODE_AUTO, GridElementCollect.MODE_COLLECT_SEPARATED].includes(this.editElement.mode);
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
    .srow {
        margin-top: 1em;
    }
</style>