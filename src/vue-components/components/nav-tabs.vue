<template>
    <div class="container-fluid px-0">
        <nav>
            <ul class="d-flex" role="tablist">
                <li v-for="tab in tabLabels" @click="selectTab(tab)" :class="tab === currentValue ? 'selected' : ''">
                    <a role="tab" :aria-selected="tab === currentValue" href="javascript:;" @click="selectTab(tab)">{{ tab | translate }}</a>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script>
    export default {
        props: ["tabLabels", "value"],
        data() {
            return {
                currentValue: this.value
            }
        },
        watch: {
            value: function (newVal, oldVal) {
                this.currentValue = newVal;
            }
        },
        methods: {
            selectTab(tab) {
                this.currentValue = tab;
                this.$emit('input', tab)
            }
        },
        mounted() {
        },
    }
</script>

<style scoped>

nav li {
    flex: 1;
    text-align: center;
    background-color: whitesmoke;
    border: 1px solid black;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    line-height: 2em;
    cursor: pointer;
}

nav li.selected, nav li.selected:hover {
    border-bottom: none;
    background-color: white;
    font-weight: bold;
}

nav a {
    //display: flex;
    //justify-content: center;
    text-decoration: none;
    color: black;
}

nav li:hover {
    background-color: lightgray;
}
</style>