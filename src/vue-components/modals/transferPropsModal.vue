<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" :aria-label="$t('navigateToOtherGrid')" aria-modal="true" role="dialog" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <div class="modal-header">
                        <edit-element-header :grid-element="gridElement" :header="$t('transferProperties')" :close-fn="close"></edit-element-header>
                    </div>

                    <div class="modal-body container-fluid px-0" v-if="gridElement">
                        <span>{{ $t('selectPropsToTransfer') }}.</span>
                        <h2 class="mt-4 mb-2">{{ $t('TAB_APPEARANCE') }}</h2>
                        <transfer-props-list-header/>
                        <ul>
                            <transfer-props-elem class="mb-5 mb-sm-3"
                                                 v-for="key in Object.keys(PROPS).filter(k => PROPS[k].category === CATEGORIES.APPEARANCE)" :key="key"
                                                 :prop-object="PROPS[key]" :grid-element="gridElement" @change="(transfer) => selectProp(transfer, PROPS[key])"/>
                        </ul>
                        <h2 class="mt-4 mb-2">{{ $t('othersHeading') }}</h2>
                        <transfer-props-list-header/>
                        <ul>
                            <transfer-props-elem class="mb-5 mb-sm-3"
                                                 v-for="key in Object.keys(PROPS).filter(k => PROPS[k].category === CATEGORIES.OTHERS)" :key="key"
                                                 :prop-object="PROPS[key]" :grid-element="gridElement" @change="(transfer) => selectProp(transfer, PROPS[key])"/>
                        </ul>
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
import TransferPropsElem from './transferPropsElem.vue';
import { constants } from '../../js/util/constants';
import { gridUtil } from '../../js/util/gridUtil';
import TransferPropsListHeader from './transferPropsListHeader.vue';

export default {
    components: { TransferPropsListHeader, TransferPropsElem, EditElementHeader},
    props: ['gridId', 'gridElementId'],
    data: function () {
        return {
            gridData: null,
            gridElement: null,
            transferObject: gridUtil.getPropTransferObjectBase(),
            PROPS: constants.TRANSFER_PROPS,
            CATEGORIES: constants.PROP_TRANSFER_CATEGORIES
        }
    },
    computed: {
        anySelected() {
            return !gridUtil.getAllPropTransferPaths().every(path => this.transferObject[path] === constants.PROP_TRANSFER_DONT_CHANGE)
        }
    },
    methods: {
        selectProp(transfer, propObject) {
            if (transfer) {
                this.$set(this.transferObject, propObject.path, this.gridElement[propObject.path]);
            } else {
                this.$set(this.transferObject, propObject.path, constants.PROP_TRANSFER_DONT_CHANGE);
            }
        },
        save() {
            if (this.anySelected) {
                this.$emit('start', this.transferObject);
            }
            this.$emit('close');
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
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