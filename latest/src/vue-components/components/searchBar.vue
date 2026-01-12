<template>
    <div class="searchContainer p-0" style="position: relative; width: 100%">
        <label class="sr-only" for="searchBar">{{ $t(label || 'search') }}</label>
        <input v-focus id="searchBar" type="search" v-model="currentValue" autocomplete="off" :placeholder="$t(placeholder || 'search') + '...'" @input="changedDebounced" @change="changedDebounced" @keydown.enter.exact="keydownEnter" @keydown.ctrl.enter.exact="keydownCtrlEnter" :disabled="disabled" style="width: 100%;">
        <div class="barButtons">
            <button :title="$t('clear')" @click="clear" :disabled="disabled" style="background-color: transparent; outline: none;"><i class="fas fa-times"></i></button>
            <button :title="$t(label || 'search')" @click="search" :disabled="disabled"><i :class="faSymbol ? `fas ${faSymbol}` : 'fas fa-search'"></i></button>
        </div>
    </div>
</template>

<script>
import { util } from '../../js/util/util';

export default {
    props: ["value", "placeholder", "keydownEnterFn", "keydownCtrlEnterFn", "faSymbol", "disabled", "label", "debounceTime"],
    data() {
        return {
            currentValue: this.value
        }
    },
    watch: {
        value: function(newVal, oldVal) {
            this.currentValue = newVal;
        }
    },
    methods: {
        changedDebounced() {
            let debounceTime = this.debounceTime || 0;
            util.debounce(this.changed, debounceTime, "SEARCH_DEBOUNCE");
        },
        changed() {
            this.$emit('input', this.currentValue);
            this.$emit('change', this.currentValue);
        },
        search() {
            this.changed();
            this.$emit('search', this.currentValue);
            this.$emit('submit', this.currentValue);
        },
        clear() {
            this.currentValue = '';
            this.changed();
        },
        keydownEnter() {
            if (this.keydownEnterFn) this.keydownEnterFn();
            this.search();
        },
        keydownCtrlEnter() {
            if (this.keydownCtrlEnterFn) this.keydownCtrlEnterFn();
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
.searchContainer .barButtons {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
}

.barButtons button {
    height: 100%;
    line-height: initial;
    margin: 0;
    padding: 0 1em;
    box-shadow: none;
    outline: 1px solid lightgray;
    border-radius: 5px;
}
</style>