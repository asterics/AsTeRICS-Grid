<template>
    <component :is="tag" v-if="!fullHeader || show">
        <div>
            <div v-if="show">
                <a tabindex="20" href="javascript:void(0)" :aria-label="$t('openSidebar')" @click="openSidebar()" style="margin: 0.2em 1em 0 0.5em; color: #266697;"><i class="fas fa-2x fa-bars inline"></i></a>
                <a tabindex="21" aria-hidden="true" href="#main" class="hide-mobile"><h1 class="inline"><img id="astericsIcon" src="app/img/asterics-aac-logo-raw.svg" height="40" alt="Asterics AAC"/></h1></a>
            </div>
            <a tabindex="22" aria-hidden="true" href="#main" class="show-mobile"><h1 class="inline"><img id="astericsIcon" src="app/img/favicon.svg" alt="Asterics AAC" style="margin: 0"/></h1></a>
        </div>
    </component>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
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