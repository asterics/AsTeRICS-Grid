import Vue from 'vue'
import {I18nModule} from "../i18nModule";
import {constants} from "../util/constants";
import {util} from "../util/util";
import {inputEventHandler} from "../util/inputEventHandler";
import {dataService} from "../service/data/dataService";
import {databaseService} from "../service/data/databaseService";

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
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
            },
            openSidebar() {
                $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
            }
        },
        mounted() {
            let thiz = this;
            I18nModule.init();
            $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                if (thiz.showSidebar) {
                    return;
                }
                if (!databaseService.getCurrentUsedDatabase()) {
                    $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                    thiz.showSidebar = true;
                    return;
                }
                dataService.getMetadata().then(metadata => {
                    if (!metadata.locked && !metadata.fullscreen) {
                        $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                        thiz.showSidebar = true;
                        $(document).trigger(constants.EVENT_GRID_RESIZE);
                    }
                });
            });
            $(document).on(constants.EVENT_SIDEBAR_CLOSE, () => {
                if (!thiz.showSidebar) {
                    return;
                }
                thiz.showSidebar = false;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            });
            window.addEventListener('resize', () => {
                util.debounce(function () {
                    $(document).trigger(constants.EVENT_GRID_RESIZE);
                }, 300, constants.EVENT_GRID_RESIZE);
            });
            inputEventHandler
                .onSwipedRight(thiz.openSidebar)
                .onSwipedLeft(thiz.closeSidebar)
                .onSwipedDown(openSidebarIfFullscreen)
                .onSwipedRight(openSidebarIfFullscreen)
                .onMouseUpperOrLeftBorder(openSidebarIfFullscreen);
            inputEventHandler.startListening();
            thiz.openSidebar();

            function openSidebarIfFullscreen() {
                dataService.getMetadata().then(metadata => {
                    if (metadata.fullscreen) {
                        metadata.fullscreen = false;
                        dataService.saveMetadata(metadata).then(() => {
                            thiz.openSidebar();
                        });
                    }
                });
            }
        },
        updated() {
            I18nModule.init();
        }
    });
};

export {MainVue}
