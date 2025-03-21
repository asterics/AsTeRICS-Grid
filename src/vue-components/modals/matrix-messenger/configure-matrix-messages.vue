<template>
    <div class="container-fluid px-0">
        <div v-if="!loggedInUser">Please login in tab "General".</div>
        <div v-if="loggedInUser">
            <div class="row">
                <label class="col-sm-3" for="matrixRoom">{{ $t('matrixRoom') }}</label>
                <div class="col-sm-7">
                    <select class="col-12" id="matrixUser" v-model="matrixRoom" @change="updateRoom">
                        <option v-for="room in matrixRooms" :value="room">{{ room.name }}</option>
                    </select>
                </div>
            </div>
            <h4>{{ $t('Messages') }}</h4>
            <div v-if="matrixRoom">{{matrixRoom.name}} {{matrixRoom.roomId}}</div>
            <div class="srow" style="max-height: 700px; overflow-y: scroll" ref="messenger">
                <div v-for="message in matrixMessages" :style="`background-color: ${message.sender === matrixUserId ? 'lightgray' : 'lightblue'}; padding: 1em; border-radius: 0.5em;
            margin-left: ${message.sender === matrixUserId ? '4em' : '0'}; margin-right: ${message.sender === matrixUserId ? '0' : '4em'}; margin-bottom: 1em;`">
                    <strong>{{message.sender}}</strong>
                    <div v-if="message.isDeleted">... message was deleted ...</div>
                    <div v-if="message.msgType === 'm.text'">{{message.textContent}}</div>
                    <div v-if="message.msgType === 'm.image'">
                        <img height="100" :src="message.imageUrl" @load="revokeBlob(message.imageUrl)">
                    </div>
                </div>
            </div>
            <div class="srow">
                <input v-model="matrixText" class="eight columns" type="text" placeholder="type message ..."/>
                <button @click="sendMatrixMessage">Send</button>
            </div>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';

    export default {
        components: { },
        props: ["loggedInUser"],
        data: function () {
            return {
                matrixMessages: [],
                matrixUserId: matrixService.getUserId(),
                matrixText: '',
                matrixRooms: [],
                matrixRoom: null,
            }
        },
        methods: {
            addMessage(event) {
                this.matrixMessages.push(event);
                this.$nextTick(() => {
                    this.$refs.messenger.scrollTop = this.$refs.messenger.scrollHeight;
                })
            },
            async sendMatrixMessage() {
                matrixService.sendMessage(this.matrixRoom.roomId, this.matrixText);
            },
            async updateRoom() {
                this.matrixMessages = await matrixService.getMessageEvents(this.matrixRoom.roomId, 0);
                this.$nextTick(() => {
                    this.$refs.messenger.scrollTop = this.$refs.messenger.scrollHeight;
                })
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
            }
        },
        async mounted() {
            this.matrixRooms = await matrixService.getRooms() || [];
            this.matrixRoom = this.matrixRooms[0];
            matrixService.onMessage(this.onMessageHandler);
        },
        beforeDestroy() {
            matrixService.onMessage(null);
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>