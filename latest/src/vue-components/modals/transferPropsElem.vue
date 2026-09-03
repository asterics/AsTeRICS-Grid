<template>
    <li class="row">
        <div class="d-none d-sm-flex col-sm-2">
            <input :id="'transfer1' + propObject.path" type="checkbox" @change="changed($event)"/>
        </div>
        <div class="col-sm-5">
            <input class="d-inline-block d-sm-none" :id="'transfer2' + propObject.path" type="checkbox" @change="changed($event)"/>
            <label class="d-none d-sm-flex" :for="'transfer1' + propObject.path" style="font-weight: normal">{{ $t(propObject.label) }}</label>
            <label class="d-inline-block d-sm-none" :for="'transfer2' + propObject.path">{{ $t(propObject.label) }}</label>
        </div>
        <div class="col-sm-3">
            <span class="d-inline-block d-sm-none">{{ $t('currentValue') }}:</span>
            <div class="d-inline-block">
                <span v-if="[undefined, null].includes(gridElement[propObject.path]) && propObject.type !== TYPES.BOOLEAN">{{ $t('noneSelected') }}</span>
                <div v-if="![undefined, null].includes(gridElement[propObject.path]) || propObject.type === TYPES.BOOLEAN">
                    <div v-if="propObject.type === TYPES.BOOLEAN">
                        <span v-if="gridElement[propObject.path]"><i class="far fa-check-square"/> {{ $t('checked') }}</span>
                        <span v-if="!gridElement[propObject.path]"><i class="far fa-square"/> {{ $t('unchecked') }}</span>
                    </div>
                    <span v-if="propObject.type === TYPES.PERCENTAGE">{{ gridElement[propObject.path] }}%</span>
                    <span v-if="propObject.type === TYPES.NUMBER">{{ gridElement[propObject.path] }}</span>
                    <span v-if="propObject.type === TYPES.TEXT">{{ $t(gridElement[propObject.path]) }}</span>
                    <div class="p-1" v-if="propObject.type === TYPES.COLOR" :style="`background-color: ${gridElement[propObject.path]}; color: ${fontUtil.getHighContrastColor(gridElement[propObject.path])}; text-align: center`">{{ gridElement[propObject.path] }}</div>
                </div>
            </div>
        </div>
    </li>
</template>

<script>
import './../../css/modal.css';
import { fontUtil } from '../../js/util/fontUtil';
import { constants } from '../../js/util/constants';

export default {
    components: {},
    props: ['propObject', 'gridElement'],
    data: function () {
        return {
            TYPES: constants.PROP_TRANSFER_TYPES,
            fontUtil: fontUtil
        }
    },
    methods: {
        changed(event) {
            this.$emit('change', event.target.checked);
        }
    },
    async mounted() {
    }
}
</script>

<style scoped>
label {
    margin-bottom: 0;
}
</style>