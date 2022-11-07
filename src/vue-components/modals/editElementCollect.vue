<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label for="selectMode" class="col-md-5">{{ $t('collectMode') }}</label>
            <div class="col-md-4">
                <select v-if="gridElement" class="col-12" id="selectMode" type="checkbox" v-model="gridElement.mode">
                    <option v-for="mode in GridElementCollect.MODES" :value="mode">{{ $t(mode) }}</option>
                </select>
            </div>
        </div>
        <div class="row">
            <label for="imageHeight" class="col-md-5">{{ $t('heightOfCollectedImages') }}</label>
            <div class="col-md-4">
                <input v-if="gridElement" class="col-12"  id="imageHeight" type="number" min="50" max="100" :disabled="!gridElement.showLabels || !autoOrSeparatedMode" v-model.number="gridElement.imageHeightPercentage"/>
            </div>
        </div>
        <div class="row">
            <label for="singleTextElemFactor" class="col-md-5">{{ $t('factorForFontSizeOfOnlytextElements') }}</label>
            <div class="col-md-4">
                <input v-if="gridElement" class="col-12" id="singleTextElemFactor" type="number" min="0" max="5" step="0.1" :disabled="!autoOrSeparatedMode" v-model.number="gridElement.textElemSizeFactor"/>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <input v-if="gridElement" id="showLabel" type="checkbox" v-model="gridElement.showLabels" :disabled="!autoOrSeparatedMode"/>
                <label for="showLabel">{{ $t('showLabelsOfCollectedImages') }}</label>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <input v-if="gridElement" id="useSingleLine" type="checkbox" v-model="gridElement.singleLine" :disabled="!autoOrSeparatedMode"/>
                <label for="useSingleLine">{{ $t('useHorizontalScrollbarIfElementsDontFit') }}</label>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <input v-if="gridElement" id="convertToLowercase" type="checkbox" v-model="gridElement.convertToLowercase"/>
                <label for="convertToLowercase">{{ $t('convertUppercaseKeyboardLettersToLowercase') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                GridElementCollect: GridElementCollect
            }
        },
        computed: {
            autoOrSeparatedMode: function () {
                return [GridElementCollect.MODE_AUTO, GridElementCollect.MODE_COLLECT_SEPARATED].includes(this.gridElement.mode);
            }
        },
        methods: {
        },
        mounted() {
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>