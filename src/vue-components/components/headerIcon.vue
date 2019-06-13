<template>
    <div>
        <div v-if="show">
            <a href="javascript:void(0)" @click="openSidebar()" style="margin: 0.3em 1em 0 0.6em"><i class="fas fa-2x fa-bars inline"></i></a>
            <a href="#main" class="hide-mobile"><h1 class="inline"><img id="astericsIcon" src="img/asterics-grid-icon.png" alt="AsTeRICS Grid"/></h1></a>
        </div>
        <a href="#main" class="show-mobile"><h1 class="inline"><img id="astericsIcon" src="img/asterics_icon.png" alt="AsTeRICS Grid" style="margin: 0"/></h1></a>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {constants} from "../../js/util/constants";
    import {MainVue} from "../../js/vue/mainVue";

    export default {
        props: [],
        data() {
            return {
                show: !MainVue.isSidebarOpen()
            }
        },
        methods: {
            openSidebar() {
                $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                this.show = false;
            }
        },
        mounted() {
            let thiz = this;
            $(document).on(constants.EVENT_SIDEBAR_CLOSE, () => {
                thiz.show = true;
            });
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_SIDEBAR_CLOSE);
        }
    }
</script>

<style scoped>
</style>