<template>
    <div class="row" style="max-height: 100%" ref="messenger">
        <div class="col">
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

export default {
    components: {},
    props: ["matrixRoomProp"],
    data: function () {
        return {
            matrixMessages: [],
            currentUser: undefined,
            matrixText: ''
        }
    },
    watch: {
        matrixRoomProp() {
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
                log.warn(this.$refs.messenger)
                this.$refs.messenger.scrollTop = this.$refs.messenger.scrollHeight;
            })
        },
        async init() {
            if (!this.matrixRoom) {
                return;
            }
            matrixService.onMessage(this.onMessageHandler);
            this.currentUser = await matrixService.getUsername();
            this.matrixMessages = await matrixService.getMessageEvents(this.matrixRoom.roomId, 0);
            this.scrollDown();
        }
    },
    async mounted() {
        let rooms = await matrixService.getRooms();
        this.matrixRoom = rooms[0];
        await this.init();
    },
    beforeDestroy() {
        matrixService.onMessage(null);
    }
}
</script>

<style scoped>
</style>