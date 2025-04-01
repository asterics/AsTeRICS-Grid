<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" :aria-label="$t('navigateToOtherGrid')" aria-modal="true" role="dialog" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <div class="modal-header">
                        <edit-element-header :grid-element="gridElement" :header="$t('propertyBrush')" :close-fn="close"></edit-element-header>
                    </div>

                    <div class="modal-body container-fluid px-0" v-if="gridElement">
                        <span>Select properties to transfer.</span>
                        <div class="d-none d-sm-flex row mt-4" aria-hidden="true">
                            <strong class="col-sm-2">Transfer?</strong>
                            <strong class="col-sm-5">Property name</strong>
                            <strong class="col-sm-3">Current value</strong>
                        </div>
                        <div class="mt-5 mt-sm-3" v-for="key in Object.keys(PROPS)">
                            <property-brush-elem :prop-object="PROPS[key]" :grid-element="gridElement" @change="(transfer) => selectProp(transfer, PROPS[key])"/>
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
                                <button class="col-12" :disabled="!anySelected" @click="save()" :title="$t('keyboardCtrlEnter')">
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
import './../../css/modal.css';
import {dataService} from "../../js/service/data/dataService";
import EditElementHeader from "../components/editElementHeader.vue";
import PropertyBrushElem from './propertyBrushElem.vue';
import { constants } from '../../js/util/constants';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { PropertyBrushElem, EditElementHeader},
    props: ['gridId', 'gridElementId'],
    data: function () {
        return {
            gridData: null,
            gridElement: null,
            brushObject: {},
            PROPS: constants.BRUSH_PROPS
        }
    },
    computed: {
        anySelected() {
            return !gridUtil.getPossibleBrushPaths().every(path => this.brushObject[path] === constants.BRUSH_DONT_CHANGE_VALUE)
        }
    },
    methods: {
        selectProp(transfer, propObject) {
            if (transfer) {
                this.$set(this.brushObject, propObject.path, this.gridElement[propObject.path]);
            } else {
                this.$set(this.brushObject, propObject.path, constants.BRUSH_DONT_CHANGE_VALUE);
            }
        },
        save() {
            if (this.anySelected) {
                this.$emit('start', this.brushObject);
            }
            this.$emit('close');
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
        for (let path of gridUtil.getPossibleBrushPaths()) {
            this.$set(this.brushObject, path, constants.BRUSH_DONT_CHANGE_VALUE);
        }
        dataService.getGrid(this.gridId).then(gridData => {
            this.gridData = JSON.parse(JSON.stringify(gridData));
            this.gridElement = this.gridData.gridElements.find(e => e.id === this.gridElementId);
        });
    }
}
</script>

<style scoped>
.modal-body {
    margin-top: 0;
}
</style>