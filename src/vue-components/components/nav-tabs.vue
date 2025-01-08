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
            },
            tabLabels: function (newVal, oldVal) {
                if (newVal.length === 1) {
                    this.selectTab(newVal[0]);
                }
            },
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
ul {
    flex-wrap: wrap;
    margin-bottom: 0;
}

nav li {
    flex: 1 1 content;
    text-align: center;
    background-color: whitesmoke;
    border-radius: 5px 5px 0 0;
    border: 1px solid lightgray;
    line-height: 2em;
    cursor: pointer;
    white-space: nowrap;
    max-height: 4em;
    padding: 3px 10px 5px 10px;
    font-weight: bold;
}

nav li.selected, nav li.selected:hover {
    text-decoration: underline;
    text-underline-offset: 5px;
    text-decoration-color: #2d7bb4;
    text-decoration-thickness: 4px;
    /*background-color: #DBF4FF;*/
    background-color: white;
    border: 3px solid lightblue;
    color: black;
    border-bottom: none;
}

nav a, nav a:focus, nav a:hover {
    text-decoration: none;
    color: black;
    outline: none;
}

nav li:hover {
    background-color: lightgray;
}
</style>