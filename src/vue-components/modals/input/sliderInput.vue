<template>
    <div class="srow">
        <label class="three columns" :for="id">
            <span>{{ label | translate }}</span>
        </label>
        <input :id="id" class="five columns" type="range" :min="min" :max="max" :step="step" :value="value" @input="changed">
        <div class="three columns">
            <span>{{ $t('currentValue') }}</span>:
            <span>{{ showValue }}{{unit ? (' ' + i18nService.t(unit)) : ''}}</span>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService.js";

    export default {
        props: ['id', 'label', 'value', 'min', 'max', 'step', 'decimals', 'unit', 'displayFactor'],
        data() {
            return {
                i18nService: i18nService
            }
        },
        computed: {
            showValue() {
                let displayFactor = this.displayFactor ? parseFloat(this.displayFactor) : 1;
                let val = parseFloat(this.value) * displayFactor;
                return this.decimals ? val.toFixed(parseInt(this.decimals)) : val;
            }
        },
        methods: {
            changed(event) {
                this.$emit('input', event.target.value);
                this.$emit('change', event.target.value);
            }
        },
        mounted() {
        },
        updated() {
        }
    }
</script>

<style scoped>
</style>