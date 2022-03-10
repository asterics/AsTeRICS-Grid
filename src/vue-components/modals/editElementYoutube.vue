<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('editYoutubePlayer') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <input v-if="editElement" id="preventClick" type="checkbox" v-model="editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]"/>
                            <label for="preventClick">{{ $t('preventMouseClickOnYoutubePlayer') }}</label>
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
    import {i18nService} from "../../js/service/i18nService";
    import {GridElement} from "../../js/model/GridElement.js";
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService.js";
    import {gridUtil} from "../../js/util/gridUtil.js";

    export default {
        props: ['gridData', 'editElementId'],
        data: function () {
            return {
                editElement: null,
                GridElement: GridElement
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
            this.editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.editElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>