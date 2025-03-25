<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-3" for="matrixRoom">{{ $t('matrixRoom') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="matrixUser" v-model="matrixRoom" @change="updateRoom">
                    <option v-for="room in matrixRooms" :value="room">{{ room.name }}</option>
                </select>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col d-inline-block">
                <h2 class="d-inline-block me-3">{{ $t('Messages') }}</h2>
                <span><i v-if="matrixRoom && matrixRoom.hasEncryptionStateEvent()" class="fas fa-lock" style="color: darkgreen" :title="$t('roomIsEncrypted')"></i></span>
                <span><i v-if="matrixRoom && !matrixRoom.hasEncryptionStateEvent()" class="fas fa-lock-open" style="color: darkred" :title="$t('roomIsNotEncrypted')"></i></span>
            </div>
        </div>
        <div class="row" v-if="!matrixMessages.length">
            <span class="col">No messages in this room.</span>
        </div>
        <div class="row" style="max-height: 20em; overflow-y: scroll" ref="messenger">
            <div class="col">
                <div v-for="message in matrixMessages" :style="`background-color: ${message.sender === currentUser ? 'lightgray' : 'lightblue'}; padding: 1em; border-radius: 0.5em;
        margin-left: ${message.sender === currentUser ? '4em' : '0'}; margin-right: ${message.sender === currentUser ? '0' : '4em'}; margin-bottom: 1em;`">
                    <strong>{{message.sender}}</strong>
                    <div v-if="message.isDeleted">... message was deleted ...</div>
                    <div v-if="message.msgType === 'm.text'">{{message.textContent}}</div>
                    <div v-if="message.msgType === 'm.image'">
                        <img height="100" :src="message.imageUrl" @load="revokeBlob(message.imageUrl)">
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <search-bar v-model="matrixText" :placeholder="$t('typeMessagePlaceholder')" fa-symbol="fa-paper-plane" @submit="sendMatrixMessage" :disabled="sendDisabled"></search-bar>
        </div>
        <div class="row d-inline" v-if="sendDisabled">
            <span><i class="fas fa-info-circle"></i></span>
            <span>{{ $t('cannotSendToEncryptedRoom') }}</span>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import SearchBar from '../../components/searchBar.vue';

    export default {
        components: { SearchBar },
        props: [],
        data: function () {
            return {
                matrixMessages: [],
                currentUser: undefined,
                matrixText: '',
                matrixRooms: [],
                matrixRoom: null,
                e2eeSupported: undefined
            }
        },
        computed: {
            sendDisabled() {
                return this.matrixRoom && this.matrixRoom.hasEncryptionStateEvent() && !this.e2eeSupported;
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
                await matrixService.sendMessage(this.matrixRoom.roomId, this.matrixText);
                this.matrixText = "";
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
            this.e2eeSupported = matrixService.isEncryptionEnabled();
            this.currentUser = await matrixService.getUsername();
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