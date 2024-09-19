<template>
    <div id="notificationBar" v-cloak v-show="tooltipHTML" style="display: flex">
        <img id="notificationBarImg" v-show="tooltipImageUrl" :src="tooltipImageUrl" alt="">
        <i v-if="tooltipOptions.faIcon" :class="tooltipOptions.faIcon"></i>
        <div class="px-3" style="width: 100%">
            <span v-html="tooltipHTML"></span>
            <div class="d-block d-md-flex justify-content-between" v-if="tooltipOptions.actionLinkFn || tooltipOptions.actionLinkFn2 || tooltipOptions.actionLinkUrl">
                <a class="d-block" v-if="tooltipOptions.actionLinkFn" href="javascript:;" @click="onActionLink" style="color: #44a8f1">{{actionLink | translate}}</a>
                <a class="d-block" v-if="tooltipOptions.actionLinkUrl" :href="tooltipOptions.actionLinkUrl" target="_blank" style="color: #44a8f1">{{actionLink | translate}}</a>
                <a class="d-block" v-if="tooltipOptions.actionLinkFn2" href="javascript:;" @click="tooltipOptions.actionLinkFn2()" style="color: #44a8f1">{{tooltipOptions.actionLink2 | translate}}</a>
                <a class="d-block" v-if="tooltipOptions.actionLinkUrl2" :href="tooltipOptions.actionLinkUrl2" target="_blank" style="color: #44a8f1">{{tooltipOptions.actionLink2 | translate}}</a>
            </div>
        </div>
        <button @click="tooltipHTML = ''" style="position: absolute; top: 0; right: 10px; padding: 0 10px" :label="$t('close')">X</button>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {util} from "../../js/util/util";

    let notificationBar = null;
    let _defaultTooltipsOptions = {
        closeOnNavigate: true,
        timeout: 0,
        revertOnClose: false,
        actionLink: '',
        actionLink2: '',
        actionLinkFn: null,
        actionLinkFn2: null,
        imageUrl: null,
        faIcon: null,
        msgType: null
    };

    export default {
        data() {
            return {
                tooltipHTML: null,
                actionLink: null,
                tooltipImageUrl: null,
                lastTooltipOptions: null,
                lastTooltipHTML: null,
                tooltipTimeoutHandler: null,
                tooltipOptions: _defaultTooltipsOptions,
                currentToolTipID: null
            }
        },
        methods: {
            setTooltip: function (html, options) {
                let thiz = this;
                if (!thiz.tooltipOptions.revertOnClose) {
                    thiz.lastTooltipHTML = this.tooltipHTML;
                    thiz.lastTooltipOptions = thiz.tooltipOptions;
                }
                thiz.tooltipOptions = Object.assign(JSON.parse(JSON.stringify(_defaultTooltipsOptions)), options);
                clearTimeout(thiz.tooltipTimeoutHandler);
                if (thiz.tooltipOptions.timeout > 0) {
                    thiz.tooltipTimeoutHandler = setTimeout(() => {
                        thiz.clearTooltip();
                    }, thiz.tooltipOptions.timeout);
                }
                switch (thiz.tooltipOptions.msgType) {
                    case 'warn':
                        thiz.tooltipOptions.faIcon = 'fas fa-exclamation-triangle fa-2x';
                        break;
                    case 'info':
                        thiz.tooltipOptions.faIcon = 'fas fa-info-circle fa-2x';
                        break;
                    case 'success':
                        thiz.tooltipOptions.faIcon = 'fas fa-check-circle fa-2x';
                        break;
                }
                this.tooltipHTML = html;
                this.tooltipImageUrl = thiz.tooltipOptions.imageUrl;
                this.actionLink = thiz.tooltipOptions.actionLink;
                this.currentToolTipID = new Date().getTime();
                return this.currentToolTipID;
            },
            clearTooltip: function (id) {
                if (id && id !== this.currentToolTipID) {
                    return;
                }
                let thiz = this;
                if (thiz.tooltipOptions.revertOnClose && this.tooltipHTML) {
                    thiz.setTooltip(thiz.lastTooltipHTML, thiz.lastTooltipOptions);
                } else {
                    this.tooltipHTML = null;
                    this.actionLink = null;
                    this.tooltipImageUrl = null;
                }
                thiz.lastTooltipOptions = {};
                thiz.lastTooltipHTML = null;
            },
            onActionLink() {
                if (this.tooltipOptions.actionLinkFn) {
                    this.tooltipOptions.actionLinkFn();
                }
            },
        },
        mounted() {
            // initNotificationBar();
            notificationBar = this;
        },
        beforeDestroy() {
        }
    }

    function initNotificationBar() {
        let NOTIFICATION_BAR_STYLE_KEY = 'NOTIFICATION_BAR_STYLE_KEY';
        let NOTIFICATION_BAR_STYLE_IMAGE_KEY = 'NOTIFICATION_BAR_STYLE_IMAGE_KEY';
        let WINDOW_SIZE_KEY = 'WINDOW_SIZE_KEY';
        let element = document.getElementById("notificationBar");
        let imgElement = document.getElementById("notificationBarImg");
        let currentWindowSize = JSON.stringify({
            x: window.innerWidth,
            y: window.innerHeight
        });
        let savedWindowSize = localStorageService.get(localStorageService.get(WINDOW_SIZE_KEY));
        localStorageService.save(WINDOW_SIZE_KEY, currentWindowSize);
        if (savedWindowSize && currentWindowSize !== savedWindowSize) {
            resetSavedNotificationBarStyles();
        }
        let savedStyle = localStorageService.get(NOTIFICATION_BAR_STYLE_KEY);
        let savedImgStyle = localStorageService.get(NOTIFICATION_BAR_STYLE_IMAGE_KEY);
        if (savedStyle) {
            element.setAttribute('style', savedStyle);
            element.style.display = 'none';
        }
        if (savedImgStyle) {
            imgElement.setAttribute('style', savedImgStyle);
        }
        $("#notificationBar").draggable({
            containment: "#app",
            start: function (event, ui) {
                element.style.bottom = "initial";
                element.style.right = "initial";
            },
            drag: function (event, ui) {
                util.debounce(() => {
                    localStorageService.save(NOTIFICATION_BAR_STYLE_KEY, element.getAttribute("style"));
                }, 300);
            }
        });
        $("#notificationBar").resizable({
            containment: "#app",
            start: function (event, ui) {
                imgElement.style.height = '90%';
                localStorageService.save(NOTIFICATION_BAR_STYLE_IMAGE_KEY, imgElement.getAttribute("style"));
                element.style.bottom = "";
                element.style.right = "";
            },
            resize: function (event, ui) {
                util.debounce(() => {
                    localStorageService.save(NOTIFICATION_BAR_STYLE_KEY, element.getAttribute("style"));
                }, 300);
            }
        });

        window.addEventListener('resize', () => {
            util.debounce(function () {
                resetSavedNotificationBarStyles();
            }, 300, 'RESIZE_RESET_NOTIFICATIONBAR');
        });

        window.resetSavedNotificationBarStyles = resetSavedNotificationBarStyles;
        function resetSavedNotificationBarStyles() {
            let displayStyle = element.style.display;
            element.setAttribute('style', "");
            imgElement.setAttribute('style', "");
            localStorageService.save(NOTIFICATION_BAR_STYLE_KEY, "");
            localStorageService.save(NOTIFICATION_BAR_STYLE_IMAGE_KEY, "");
            element.style.display = displayStyle;
        }
    }
</script>

<style scoped>
    #notificationBar {
        position: absolute;
        bottom: 1vh;
        right: 1vw;
        z-index: 100;
        background: black;
        opacity: 0.85;
        border-radius: 10px;
        color: whitesmoke;
        width: 40vw;
        padding: 10px 50px 10px 10px;
        cursor: grab;
    }

    @media (max-width: 850px) {
        #notificationBar {
            width: 50vw;
            padding: 10px 35px 10px 10px;
        }
    }

    #notificationBarImg {
        vertical-align: middle;
        max-height: 100%;
        max-width: 80%;
        height: 4vh;
        width: auto
    }
</style>