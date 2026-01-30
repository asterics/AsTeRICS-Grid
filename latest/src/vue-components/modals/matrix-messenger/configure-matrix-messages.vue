<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-3" for="matrixRoom">{{ $t('selectRoom') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="matrixRoom" v-model="matrixRoom">
                    <option v-for="room in matrixRooms" :value="room">{{ room.name }}</option>
                </select>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col d-inline-block">
                <h2 class="d-inline-block me-3">{{ $t('TAB_MESSAGES') }}</h2>
                <span><i v-if="matrixRoom && matrixRoom.hasEncryptionStateEvent()" class="fas fa-lock" style="color: darkgreen" :title="$t('endToEndEncrypted')"></i></span>
                <span><i v-if="matrixRoom && !matrixRoom.hasEncryptionStateEvent()" class="fas fa-lock-open" style="color: darkred" :title="$t('notEndToEndEncrypted')"></i></span>
            </div>
        </div>
        <matrix-conversation :matrix-room-prop="matrixRoom" style="max-height: 20em; overflow-y: scroll"/>
        <div class="row">
            <search-bar v-model="matrixText" :placeholder="$t('typeMessagePlaceholder')" fa-symbol="fa-paper-plane" @submit="sendMatrixMessage" :disabled="sendDisabled" label="sendMessage"></search-bar>
        </div>
        <div class="row" v-if="sendDisabled">
            <div class="col">
                <span><i class="fas fa-info-circle"></i></span>
                <span>{{ $t('cannotSendToEncryptedRoom') }}.</span>
            </div>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import SearchBar from '../../components/searchBar.vue';
    import MatrixConversation from '../../components/matrix-conversation.vue';

    export default {
        components: { MatrixConversation, SearchBar },
        props: [],
        data: function () {
            return {
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
            async sendMatrixMessage() {
                await matrixService.sendMessage(this.matrixRoom.roomId, this.matrixText);
                this.matrixText = "";
            }
        },
        async mounted() {
            this.matrixRooms = await matrixService.getRooms() || [];
            this.matrixRoom = this.matrixRooms[0];
            this.e2eeSupported = matrixService.isEncryptionEnabled();
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