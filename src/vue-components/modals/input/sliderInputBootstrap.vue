<template>
    <div class="row">
        <label :class="labelClass || 'col-12 col-md-4'" :for="id">
            <span>{{ label | translate }}</span>
        </label>
        <input :id="id" :class="(inputClass || 'col-12 col-md-4 normal-text')" type="range" :min="min" :max="max" :step="step" :value="value" @input="changed">
        <div class="col">
            <span>{{ $t('currentValue') }}</span>:
            <span>{{ showValue }}<span v-if="value || value === 0">{{unit ? (' ' + i18nService.t(unit)) : ''}}</span></span>
            <button v-if="showClearButton" class="py-1 px-3 ms-2" :disabled="!value" :title="$t('clear')" @click="emitChange(null)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService.js";

    export default {
        props: ['id', 'label', 'value', 'min', 'max', 'step', 'decimals', 'unit', 'displayFactor', 'default', 'showClearButton', 'labelClass', 'inputClass', 'textClass'],
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
            this.skeletonFix = this.skeletonFix !== false;
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