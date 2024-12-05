<template>
    <div id="notificationBar" v-cloak v-show="tooltipHTML" style="display: flex">
        <img id="notificationBarImg" v-show="tooltipImageUrl" :src="tooltipImageUrl" alt="">
        <i v-if="tooltipOptions.faIcon" :class="tooltipOptions.faIcon"></i>
        <div style="padding-left: 0.5em">
            <span v-html="tooltipHTML"></span>
            <div class="d-block d-md-flex justify-content-between" v-if="tooltipOptions.actionLinkFn || tooltipOptions.actionLinkFn2 || tooltipOptions.actionLinkUrl">
                <a class="d-block" v-if="tooltipOptions.actionLinkFn" href="javascript:;" @click="onActionLink" style="color: #44a8f1">{{actionLink | translate}}</a>
                <a class="d-block" v-if="tooltipOptions.actionLinkFn2" href="javascript:;" @click="tooltipOptions.actionLinkFn2()" style="color: #44a8f1">{{tooltipOptions.actionLink2 | translate}}</a>
                <a class="d-block" v-if="tooltipOptions.actionLinkUrl" :href="tooltipOptions.actionLinkUrl" target="_blank" style="color: #44a8f1">{{actionLink | translate}}</a>
            </div>
        </div>
        <button @click="tooltipHTML = ''" style="position: absolute; top: 0; right: 10px; padding: 0 10px" :label="$t('close')">X</button>
    </div>
</template>

<script>
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
            notificationBar = this;
        },
        beforeDestroy() {
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