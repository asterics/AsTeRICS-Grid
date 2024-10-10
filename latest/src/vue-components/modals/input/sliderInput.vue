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
        props: ['id', 'label', 'value', 'min', 'max', 'step', 'decimals', 'unit', 'displayFactor', 'default'],
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
            emitChange(value) {
                this.$emit('input', value);
                this.$emit('change', value);
            },
            changed(event) {
                this.emitChange(event.target.value)
            }
        },
        mounted() {
            if (this.value === undefined && this.default) {
                this.emitChange(parseFloat(this.default));
            }
        },
        updated() {
        }
    }
</script>

<style scoped>
</style>