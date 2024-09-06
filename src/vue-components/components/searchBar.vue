<template>
    <div class="searchContainer" style="position: relative; width: 100%">
        <label class="sr-only" for="searchBar">{{ $t('search') }}</label>
        <input id="searchBar" type="search" v-model="currentValue" :placeholder="$t('search')" @input="changed" @change="changed" style="width: 100%;">
        <div class="barButtons">
            <button :title="$t('clear')" @click="clear" style="background-color: transparent; outline: none;"><i class="fas fa-times"></i></button>
            <button :title="$t('search')" @click="changed"><i class="fas fa-search"></i></button>
        </div>
    </div>
</template>

<script>
export default {
    props: ["value"],
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
        changed() {
            this.$emit('input', this.currentValue);
            this.$emit('change', this.currentValue);
        },
        clear() {
            this.currentValue = '';
            this.changed();
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
}

.barButtons button {
    line-height: 1.5;
    margin: 0;
    padding: 0 1em;
    box-shadow: none;
    outline: 1px solid lightgray;
    border-radius: 5px;
}
</style>