<template>
    <div>
        <button @click="() => {open = !open}" class="btn-accordion" style="margin-bottom: 0">
            <i class="fas fa-chevron-down arrow" v-show="!open"></i>
            <i class="fas fa-chevron-up arrow" v-show="open"></i>
            <component :is="componentType" style="margin-left: 2em; display: inline-block" data-i18n="">{{label | translate}}</component>
        </button>
        <div v-show="open" class="accordion-content" :style="'background-color:' + backgroundColor">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";

    export default {
        props: ["accLabel", "accOpen", 'accLabelType', 'accBackgroundColor'],
        data() {
            return {
                open: this.accOpen === "true",
                componentType: this.accLabelType || 'span',
                label: '',
                backgroundColor: this.accBackgroundColor || 'whitesmoke'
            }
        },
        methods: {
        },
        mounted() {
            i18nService.initDomI18n();
            this.label = this.accLabel;
        },
        updated() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .btn-accordion {
        background-color: white;
        border-style: solid;
        border-color: gray;
        border-width: 1px;
        text-align: left;
        border-left: none;
        border-right: none;
        width: 100%;
        padding-left: 1.0em;
        position: relative;
    }
    .btn-accordion:hover, .btn-accordion:focus {
        outline: 2px solid lightblue;
    }
    .btn-accordion:hover span {
        color: #2d7bb4;
    }

    .arrow {
        position: absolute;
        top: 25%;
    }

    .accordion-content {
        padding: 1em;
        outline: 1px solid lightgray;
    }
</style>