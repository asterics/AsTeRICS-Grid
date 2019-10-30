<template>
    <div>
        <div class="area">
            <div class="area-row" v-for="i in rows">
                <div class="area-column" v-for="j in columns">
                    <div class="area-element" :style="`top: ${(i-1)*height}%; left: ${(j-1)*width}%; width: ${width}%; height: ${height}%;`">
                        <div class="area-element-inner" :id="i + ' ' + j"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';

    export default {
        props: {
            selectedElement: HTMLElement
        },
        watch: {
            selectedElement: {
                handler: function (newObject) {
                    $('.area-element-inner').removeClass('selected');
                    $(newObject).addClass('selected');
                },
                deep: true
            }
        },
        data() {
            return {
                rows: 10,
                columns: 10,
                width: 0,
                height: 0
            }
        },
        methods: {
            calcWidthHeight() {
                this.width = 100 / this.columns;
                this.height = 100 / this.rows;
            }
        },
        mounted() {
            let thiz = this;
            thiz.calcWidthHeight();
        },
        updated() {
        }
    }
</script>

<style scoped>
    .area {
        width: 60%;
        padding-top: 60%;
        position: relative;
    }

    .area-row, .area-column {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }

    .area-element {
        position: absolute;
    }

    .area-element-inner {
        border: 1px solid gray;
        border-radius: 5px;
        position: relative;
        width: 90%;
        height: 90%;
        margin: 5%;
        background-color: lightblue;
        z-index: 100;
    }

    .active {
        outline: 3px solid red;
    }

    .inactive {
        background-color: whitesmoke !important;
        animation: none !important;
    }

    .selected {
        -webkit-animation: background 5s cubic-bezier(1,0,0,1) !important;
        animation: background 5s cubic-bezier(1,0,0,1) !important;
    }

    .mouseentered {
        outline: 3px solid green !important;
        background-color: lightgreen;
    }

    @-webkit-keyframes background {
        0% { background-color: dodgerblue; }
        100% { background-color: lightblue; }
    }

    @keyframes background {
        0% { background-color: dodgerblue; }
        100% { background-color: lightblue; }
    }
</style>