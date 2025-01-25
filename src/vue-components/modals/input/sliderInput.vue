<template>
    <div class="srow">
        <label :class="showClearButton ? 'two columns' : 'three columns'" :for="id">
            <span>{{ label | translate }}</span>
        </label>
        <input :id="id" :class="showClearButton ? 'four columns' : 'five columns'" type="range" :min="min" :max="max" :step="step" :value="value" @input="changed">
        <div class="three columns">
            <span>{{ $t('currentValue') }}</span>:
            <span>{{ showValue }}<span v-if="value || value === 0">{{unit ? (' ' + i18nService.t(unit)) : ''}}</span></span>
        </div>
        <button v-if="showClearButton" class="two columns" :disabled="!value" @click="emitChange(null)">{{ $t('clear') }}</button>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService.js";

    export default {
        props: ['id', 'label', 'value', 'min', 'max', 'step', 'decimals', 'unit', 'displayFactor', 'default', 'showClearButton'],
        data() {
            return {
                i18nService: i18nService
            }
        },
        computed: {
            showValue() {
                if (!this.value && this.value !== 0) {
                    return i18nService.t('noneSelected');
                }
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