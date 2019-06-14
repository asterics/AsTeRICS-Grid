import Vue from 'vue'
import {I18nModule} from "../i18nModule";
import {constants} from "../util/constants";
import {util} from "../util/util";
import {inputEventHandler} from "../util/inputEventHandler";
import {dataService} from "../service/data/dataService";

let MainVue = {};
let app = null;

MainVue.setViewComponent = function (component, properties) {
    app.setComponent(component, properties);
};

MainVue.isSidebarOpen = function () {
    return app.showSidebar;
};

MainVue.init = function () {
    app = new Vue({
        el: '#app',
        data() {
            return {
                component: null,
                properties: null,
                componentKey: 0,
                showSidebar: false
            }
        },
        methods: {
            setComponent(component, properties) {
                this.component = component;
                this.properties = properties;
                this.componentKey++; //forces to update the view, even with same component (e.g. grid view, other page)
            },
            closeSidebar() {
                this.showSidebar = false;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            },
            openSidebar() {
                let thiz = this;
                try {
                    //TODO: better .catch()?!
                    dataService.getMetadata().then(metadata => {
                        if (!metadata.locked) {
                            thiz.showSidebar = true;
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        }
                    });
                } catch (e) {
                    thiz.showSidebar = true;
                }
            }
        },
        mounted() {
            let thiz = this;
            I18nModule.init();
            $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                thiz.openSidebar();
            });
            $(document).on(constants.EVENT_SIDEBAR_CLOSE, () => {
                thiz.closeSidebar();
            });
            window.addEventListener('resize', () => {
                util.debounce(function () {
                    $(document).trigger(constants.EVENT_GRID_RESIZE);
                }, 300, constants.EVENT_GRID_RESIZE);
            });
            inputEventHandler
                .onSwipedRight(thiz.openSidebar)
                .onSwipedLeft(thiz.closeSidebar);
            inputEventHandler.startListening();
            $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
        },
        updated() {
            I18nModule.init();
        }
    });
};

export {MainVue}
