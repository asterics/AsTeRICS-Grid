<template>
    <div class="container-fluid px-0">
        <div class="row">
            <div class="col-12">
                <input v-if="gridElement" id="preventClick" type="checkbox" v-model="gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]"/>
                <label for="preventClick">{{ $t('preventMouseClickOnYoutubePlayer') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                GridElement: GridElement
            }
        },
        methods: {
        },
        mounted() {
            this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
</style>