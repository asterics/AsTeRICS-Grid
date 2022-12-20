<template>
    <div class="srow">
        <label class="three columns" :for="id">
            <span>{{ label }}</span>
        </label>
        <input :id="id" class="five columns" type="range" :min="min" :max="max" :step="step" :value="value" @input="changed">
        <div class="three columns">
            <span>{{ $t('currentValue') }}</span>:
            <span>{{ showValue }}{{unit ? unit : ''}}</span>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['id', 'label', 'value', 'min', 'max', 'step', 'decimals', 'unit', 'displayFactor'],
        data() {
            return {
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