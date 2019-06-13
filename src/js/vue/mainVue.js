import Vue from 'vue'
import {I18nModule} from "../i18nModule";
import {constants} from "../util/constants";

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
                showSidebar: true
            }
        },
        methods: {
            setComponent(component, properties) {
                this.component = component;
                this.properties = properties;
                this.componentKey++; //forces to update the view, even with same component (e.g. grid view, other page)
            },
            closeSidebar() {
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                $(document).trigger(constants.EVENT_GRID_RESIZE);
                this.showSidebar = false;
            }
        },
        mounted() {
            let thiz = this;
            I18nModule.init();
            $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                thiz.showSidebar = true;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            });
            window.addEventListener('resize', () => {
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            });
        },
        updated() {
            I18nModule.init();
        }
    });
};

export {MainVue}
