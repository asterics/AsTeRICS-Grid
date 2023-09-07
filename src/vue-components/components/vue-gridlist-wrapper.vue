<template>
    <ul v-if="gridData" :id="gridData.id" class="grid">
        <li class="position-highlight" style="display: none;">
            <div class="grid-item-content-placeholder"></div>
        </li>
        <li v-for="element of gridData.gridElements" class="item" :data-w="element.width" :data-h="element.height" :data-x="element.posX" :data-y="element.posY" :data-id="element.id">
            <div class="grid-item-content" tabindex="40" style="border: 1px solid">
                <div class="img-container" style="width: 100%; max-height: 80%">
                    <img v-if="element.image" :src="element.image.data || element.image.url" draggable="false" style="max-width: 98%; max-height: 98%; object-fit: contain; margin: 1%;" crossorigin="anonymous"/>
                </div>
                <div class="text-container" style=""><span>{{ element.label | extractTranslation }}</span></div>
            </div>
        </li>
    </ul>
</template>

<script>
    import $ from "../../js/externals/jquery.js";
    import {constants} from "../../js/util/constants.js";

    export default {
        props: ["gridData"],
        data() {
            return {
            }
        },
        methods: {
            toggleOpen() {
            }
        },
        mounted() {
            log.warn("hier!");
            let thiz = this;
            log.warn(this.gridData.minColumnCount);
            $(this.$el).gridList(
                {
                    lanes: this.gridData.rowCount,
                    minColumns: this.gridData.minColumnCount,
                    widthHeightRatio: 1,
                    heightToFontSizeRatio: 0.25,
                    dragAndDrop: false
                },
                {
                    start: function () {},
                    stop: function () {}
                }
            );/*
            setTimeout(() => {
                $(thiz.$el).gridList("autosize");
                log.warn("autosize")
            }, 1000)*/
        },
    }
</script>

<style scoped>
</style>