<template>
    <component :is="tag" v-if="!fullHeader || show">
        <div aria-hidden="true">
            <div v-if="show">
                <a tabindex="20" href="javascript:void(0)" @click="openSidebar()" style="margin: 0.2em 1em 0 0.5em; color: #266697;"><i class="fas fa-2x fa-bars inline"></i></a>
                <a tabindex="21" href="#main" class="hide-mobile"><h1 class="inline"><img id="astericsIcon" src="app/img/asterics-grid-icon-raw.svg" height="40" width="121" alt="AsTeRICS Grid"/></h1></a>
            </div>
            <a tabindex="22" href="#main" class="show-mobile"><h1 class="inline"><img id="astericsIcon" src="app/img/asterics_icon.png" alt="AsTeRICS Grid" style="margin: 0"/></h1></a>
        </div>
    </component>
</template>

<script>
    import $ from 'jquery';
    import {constants} from "../../js/util/constants";
    import {MainVue} from "../../js/vue/mainVue";

    export default {
        props: ['fullHeader'], //if true this component is rendered as full header, otherwise as part of an already existing header
        data() {
            return {
                show: !MainVue.isSidebarOpen(),
                tag: 'div'
            }
        },
        methods: {
            openSidebar() {
                $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                this.show = false;
            },
            onOpenFn() {
                this.show = false;
            },
            onCloseFn() {
                this.show = true;
            }
        },
        mounted() {
            $(document).on(constants.EVENT_SIDEBAR_CLOSE, this.onCloseFn);
            $(document).on(constants.EVENT_SIDEBAR_OPENED, this.onOpenFn);
            if (this.fullHeader) {
                this.tag = 'header';
            }
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_SIDEBAR_CLOSE, document, this.onCloseFn);
        }
    }
</script>

<style scoped>
</style>