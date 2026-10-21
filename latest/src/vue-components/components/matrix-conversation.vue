<template>
    <div class="row" :style="`max-height: 100%; overflow-y: scroll; font-size: ${fontSize}`" ref="messenger">
        <div v-if="loading">
            <span class="col">{{ $t('loading') }}...</span>
            <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div v-if="!matrixRoom && !loading">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ $t('matrixMessengerNotLoggedInOrNoRoom') }}</span>
            <div class="mt-5">{{ $t('goToMatrixSettingsToConfigure') }}</div>
        </div>
        <div class="col" v-if="matrixRoom && !loading">
            <div class="mb-5">
                <h2 class="mb-2">{{ matrixRoom.name }}</h2>
                <matrix-room-description :room="matrixRoom" :full="true" :logged-in-user="currentUser"/>
                <div v-if="matrixRoom.hasEncryptionStateEvent()">
                    <i class="fas fa-lock" style="color: darkgreen"></i> <span>{{ $t('endToEndEncrypted') }}</span>
                </div>
                <div v-if="!matrixRoom.hasEncryptionStateEvent()">
                    <i class="fas fa-lock-open" style="color: darkred"></i> <span>{{ $t('notEndToEndEncrypted') }}</span>
                </div>
            </div>
            <div class="row" v-if="!matrixMessages.length">
                <span class="col">{{ $t('noMessagesInRoom') }}.</span>
            </div>
            <div class="row" v-for="message in matrixMessages">
                <div class="col">
                    <div :class="`message ${message.sender === currentUser ? 'message-own' : 'message-other'}`">
                        <div>
                            <strong>{{ message.sender }}</strong>
                        </div>
                        <div v-if="message.isDeleted">... {{ $t('messageWasDeleted') }} ...</div>
                        <div v-if="message.msgType === 'm.text' && isOnlyEmojis(message.textContent)" style="font-size: 4em">{{ message.textContent }}</div>
                        <div v-if="message.msgType === 'm.text' && !isOnlyEmojis(message.textContent)">{{ message.textContent }}</div>
                        <div v-if="message.msgType === 'm.image'">
                            <img :src="message.imageUrl" @load="revokeBlob(message.imageUrl)" style="max-width: 100%">
                            <div>{{ message.textContent }}</div>
                        </div>
                        <div class="d-flex" style="justify-content: flex-end; font-size: 0.8em">
                            <span>{{ message.dateTimeReadable }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" v-if="sending">
                <div class="col">
                    <div class="message message-own">
                        <div>
                            <strong>{{ currentUser }}</strong>
                        </div>
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import '../../css/modal.css';
import { matrixService } from '../../js/service/matrixMessenger/matrixService';
import $ from '../../js/externals/jquery';
import { constants } from '../../js/util/constants';
import MatrixRoomDescription from './matrix-room-description.vue';
import { matrixAppService } from '../../js/service/matrixMessenger/matrixAppService';
import { speechService } from '../../js/service/speechService';
import { util } from '../../js/util/util';
import { fontUtil } from '../../js/util/fontUtil';

export default {
    components: { MatrixRoomDescription },
    props: ["matrixRoomProp", "gridElement", "metadata", "containerSize"],
    data: function () {
        return {
            matrixRooms: null,
            matrixRoom: null,
            matrixMessages: [],
            currentUser: undefined,
            matrixText: '',
            loading: true,
            sending: false,
            fontSize: "unset"
        }
    },
    watch: {
        matrixRoomProp() {
            this.matrixRooms = [];
            this.matrixRoom = this.matrixRoomProp;
            this.init();
        },
        containerSize() {
            this.calcFontSize();
        }
    },
    methods: {
        calcFontSize() {
            if (!this.metadata) {
                this.fontSize = "unset";
            }
            let pxSize = fontUtil.pctToPx(this.metadata.textConfig.fontSizePct) / 9; // normally fontSizePct is relative to element size, use some value found experimentally based on app container size instead
            this.fontSize = pxSize + "px";
        },
        addMessage(msg) {
            this.sending = false;
            this.matrixMessages.push(msg);
            this.matrixMessages.sort((a, b) => a.timestamp - b.timestamp);
            this.scrollDown();
            if (this.gridElement && this.gridElement.autoSpeak && msg.sender !== this.currentUser) {
                let text = msg.textContent;
                if (msg.msgType === 'm.image' && text.length) {

                }
                speechService.speak(msg.textContent);
            }
        },
        onMessageHandler(msg) {
            if (msg.roomId === this.matrixRoom.roomId) {
                this.addMessage(msg);
            }
        },
        isOnlyEmojis(msg) {
            msg = util.replaceAll(msg, " ", "");
            return util.isOnlyEmojis(msg);
        },
        revokeBlob(url) {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        },
        scrollDown() {
            setTimeout(() => {
                this.$nextTick(() => {
                    this.$refs.messenger.scrollTop = this.$refs.messenger.scrollHeight;
                });
            }, 100);
        },
        async init() {
            if (!this.matrixRoom) {
                return;
            }
            this.loading = true;
            matrixService.onMessage(this.onMessageHandler);
            this.currentUser = await matrixService.getUsername();
            this.matrixMessages = await matrixService.getMessageEvents(this.matrixRoom.roomId, 0);
            this.loading = false;
            this.scrollDown();
        },
        scroll(diff) {
            this.$nextTick(() => {
                let newScroll = this.$refs.messenger.scrollTop + diff;
                newScroll = Math.min(newScroll, this.$refs.messenger.scrollHeight);
                newScroll = Math.max(0, newScroll);
                this.$refs.messenger.scrollTop = newScroll;
            });
        },
        onScrollUpEvent(event, diff = 50) {
            this.scroll(diff * (-1));
        },
        onScrollDownEvent(event, diff = 50)  {
            this.scroll(diff);
        },
        async onRoomChangeEvent(event, roomId) {
            this.matrixRoom = this.matrixRooms.find(r => r.roomId === roomId);
            await this.init();
        },
        onSendingStart() {
            this.sending = true;
            this.scrollDown();
        }
    },
    async mounted() {
        this.loading = true;
        this.matrixRooms = await matrixService.getRooms() || [];
        this.matrixRoom = matrixAppService.getCurrentRoom() || this.matrixRooms[0];
        await this.init();
        this.loading = false;
        $(document).on(constants.EVENT_MATRIX_SCROLL_UP, this.onScrollUpEvent);
        $(document).on(constants.EVENT_MATRIX_SCROLL_DOWN, this.onScrollDownEvent);
        $(document).on(constants.EVENT_MATRIX_SET_ROOM, this.onRoomChangeEvent);
        $(document).on(constants.EVENT_MATRIX_SENDING_START, this.onSendingStart);
    },
    beforeDestroy() {
        matrixService.onMessage(null);
        $(document).off(constants.EVENT_MATRIX_SCROLL_UP, this.onScrollUpEvent);
        $(document).off(constants.EVENT_MATRIX_SCROLL_DOWN, this.onScrollDownEvent);
        $(document).off(constants.EVENT_MATRIX_SET_ROOM, this.onRoomChangeEvent);
        $(document).off(constants.EVENT_MATRIX_SENDING_START, this.onSendingStart);
    }
}
</script>

<style scoped>
.message {
    padding: 1em;
    border-radius: 0.5em;
    margin-bottom: 1em;
}

.message-own {
    background-color: lightgray;
    margin-left: 4em;
    margin-right: 0;
}

.message-other {
    background-color: lightblue;
    margin-left: 0;
    margin-right: 4em;
}
</style>