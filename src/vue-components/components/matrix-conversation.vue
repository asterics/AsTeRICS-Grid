<template>
    <div class="row" style="max-height: 100%; overflow-y: scroll" ref="messenger">
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
                <matrix-room-description :room="matrixRoom" :full="true"/>
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
                    <div :style="`background-color: ${message.sender === currentUser ? 'lightgray' : 'lightblue'}; padding: 1em; border-radius: 0.5em;
        margin-left: ${message.sender === currentUser ? '4em' : '0'}; margin-right: ${message.sender === currentUser ? '0' : '4em'}; margin-bottom: 1em;`">
                        <strong>{{message.sender}}</strong>
                        <div v-if="message.isDeleted">... {{ $t('messageWasDeleted') }} ...</div>
                        <div v-if="message.msgType === 'm.text'">{{ message.textContent }}</div>
                        <div v-if="message.msgType === 'm.image'">
                            <img height="100" :src="message.imageUrl" @load="revokeBlob(message.imageUrl)">
                        </div>
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

export default {
    components: { MatrixRoomDescription },
    props: ["matrixRoomProp"],
    data: function () {
        return {
            matrixRooms: null,
            matrixRoom: null,
            matrixMessages: [],
            currentUser: undefined,
            matrixText: '',
            loading: true
        }
    },
    watch: {
        matrixRoomProp() {
            this.matrixRooms = [];
            this.matrixRoom = this.matrixRoomProp;
            this.init();
        }
    },
    methods: {
        addMessage(event) {
            this.matrixMessages.push(event);
            this.scrollDown();
        },
        onMessageHandler(event) {
            if (event.roomId === this.matrixRoom.roomId) {
                this.addMessage(event);
            }
        },
        revokeBlob(url) {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        },
        scrollDown() {
            this.$nextTick(() => {
                this.$refs.messenger.scrollTop = this.$refs.messenger.scrollHeight;
            });
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
        }
    },
    async mounted() {
        this.loading = true;
        this.matrixRooms = await matrixService.getRooms() || [];
        this.matrixRoom = this.matrixRooms[0];
        await this.init();
        this.loading = false;
        $(document).on(constants.EVENT_MATRIX_SCROLL_UP, this.onScrollUpEvent);
        $(document).on(constants.EVENT_MATRIX_SCROLL_DOWN, this.onScrollDownEvent);
        $(document).on(constants.EVENT_MATRIX_SET_ROOM, this.onRoomChangeEvent);
    },
    beforeDestroy() {
        matrixService.onMessage(null);
        $(document).off(constants.EVENT_MATRIX_SCROLL_UP, this.onScrollUpEvent);
        $(document).off(constants.EVENT_MATRIX_SCROLL_DOWN, this.onScrollDownEvent);
        $(document).off(constants.EVENT_MATRIX_SET_ROOM, this.onRoomChangeEvent);
    }
}
</script>

<style scoped>
</style>