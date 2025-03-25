<template>
    <div class="container-fluid px-0">
        <h2 class="mb-4">Rooms</h2>
        <div class="row d-sm-flex d-none">
            <strong class="col-4">Room name</strong>
            <strong class="col-5">Members</strong>
            <strong class="col-3">Actions</strong>
        </div>
        <ul>
            <li class="row mb-sm-2 mb-5" v-for="room in rooms">
                <div class="col-sm-4">
                    <i v-if="room.hasEncryptionStateEvent()" class="fas fa-lock" style="color: darkgreen" :title="$t('roomIsEncrypted')"></i>
                    <i v-if="!room.hasEncryptionStateEvent()" class="fas fa-lock-open" style="color: darkred" :title="$t('roomIsNotEncrypted')"></i>
                    <span class="ms-2 d-sm-inline d-none">{{ room.name }}</span>
                    <strong class="ms-2 d-sm-none d-inline">{{ room.name }}</strong>
                </div>
                <div class="col-sm-5">
                    <strong class="d-sm-none d-inline" v-if="!isPrivateRoom(room)">Members:</strong>
                    <span v-if="isPrivateRoom(room)">Private room with "{{ getPrivateRoomPartner(room) }}"</span>
                    <span v-if="!isPrivateRoom(room)">{{ getAllMembersString(room) }}</span>
                </div>
                <div class="col-sm-3 mt-sm-0 mt-2">
                    <button class="actionBtn" @click="leaveRoom(room)">
                        <i v-if="leavingRoom.roomId === room.roomId" class="fas fa-spinner fa-spin"/>
                        <i v-if="leavingRoom.roomId !== room.roomId" class="fas fa-sign-out-alt"/>
                        <span>Leave</span>
                    </button>
                </div>
            </li>
        </ul>
        <h2>New Room</h2>
        <div class="row my-4">
            <label class="col-sm-3" for="newRoomUser">{{ $t('newRoomUser') }}</label>
            <div class="col-sm-4">
                <input type="text" class="col-12" id="newRoomUser" v-model="newRoomUser" @input="checkUsername"/>
            </div>
            <div class="col-sm-5">
                <div v-if="checking">
                    <span>checking ...</span>
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div v-if="userExists !== undefined">
                    <i v-if="userExists" class="fas fa-check"></i>
                    <i v-if="!userExists" class="fas fa-times"></i>
                    <span>User <strong>"{{fullUsername}}" </strong></span>
                    <span v-if="userExists">exists!</span>
                    <span v-if="!userExists">not found!</span>
                </div>
            </div>
        </div>
        <div class="row">
            <label class="col-sm-3" for="roomName">{{ $t('roomName') }}</label>
            <div class="col-sm-4">
                <input type="text" class="col-12" id="roomName" v-model="newRoomName" :placeholder="$t('(optional)')"/>
            </div>
        </div>
        <div class="row" v-if="canUseEncryption">
            <div class="col-auto">
                <input type="checkbox" id="useEncryption" v-model="newRoomEncrypted"/>
            </div>
            <label class="col" for="useEncryption">{{ $t('useEndToEndEncryption') }}</label>
        </div>
        <div class="mt-4">
            <button class="me-4" @click="createRoom" :disabled="createRoomDisabled">
                <i v-if="createRoomState === CREATE_ROOM_STATES.LOADING" class="fas fa-spinner fa-spin"></i>
                <i v-if="createRoomState !== CREATE_ROOM_STATES.LOADING" class="fas fa-plus"></i>
                <span>Create room</span>
            </button>
            <span v-if="createRoomState === CREATE_ROOM_STATES.ERROR" style="color: red"><i class="fas fa-times"></i> could not create room!</span>
            <span v-if="createRoomState === CREATE_ROOM_STATES.SUCCESS" style="color: green"><i class="fas fa-check"></i> successfully created room!</span>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import { util } from '../../../js/util/util';

    const CREATE_ROOM_STATES = {
        INITIAL: "INITIAL",
        LOADING: "LOADING",
        SUCCESS: "SUCCESS",
        ERROR: "ERROR",
    };

    export default {
        components: {},
        props: [],
        data: function () {
            return {
                rooms: [],
                loggedInUserFull: "",
                loggedInUser: "",
                userExists: undefined,
                checking: false,
                fullUsername: "",
                newRoomUser: "",
                newRoomName: "",
                canUseEncryption: undefined,
                newRoomEncrypted: undefined,
                CREATE_ROOM_STATES: CREATE_ROOM_STATES,
                createRoomState: CREATE_ROOM_STATES.INITIAL,
                leavingRoom: {}
            }
        },
        computed: {
            createRoomDisabled() {
                return !this.userExists || this.fullUsername === this.loggedInUserFull || this.rooms.find(r => r.name === this.newRoomName);
            }
        },
        methods: {
            async checkUsername() {
                this.userExists = undefined;
                this.createRoomState = CREATE_ROOM_STATES.INITIAL;
                if (!this.newRoomUser) {
                    this.checking = false;
                    util.clearDebounce("MATRIX_CHECK_USER");
                    return;
                }
                this.checking = true;
                util.debounce(async () => {
                    this.fullUsername = matrixService.getFullUsername(this.newRoomUser);
                    this.userExists = await matrixService.existsUser(this.newRoomUser);
                    this.checking = false;
                }, 700, "MATRIX_CHECK_USER");
            },
            async createRoom() {
                if (this.createRoomDisabled) {
                    return;
                }
                this.createRoomState = CREATE_ROOM_STATES.LOADING;
                let result = await matrixService.createPrivateRoom(this.fullUsername, this.newRoomEncrypted, this.newRoomName);
                this.rooms = await matrixService.getRooms();
                this.createRoomState = result ? CREATE_ROOM_STATES.SUCCESS : CREATE_ROOM_STATES.ERROR;
            },
            async leaveRoom(room) {
                if(!confirm("Do you really want to leave room " + room.name)) {
                    return;
                }
                this.leavingRoom = room;
                this.$nextTick(async () => {
                    await matrixService.leaveRoom(room.roomId);
                });
            },
            isPrivateRoom(room) {
                return room.getMembers().length === 2;
            },
            getPrivateRoomPartner(room) {
                let names = room.getMembers().map(m => m.name);
                return names.filter(name => name !== this.loggedInUser)[0];
            },
            getAllMembersString(room) {
                let names = room.getMembers().map(m => m.name);
                names.sort((a, b) => {
                    if (a === this.loggedInUser) {
                        return -1;
                    }
                    if (b === this.loggedInUser) {
                        return 1;
                    }
                    return a.localeCompare(b);
                });
                return names.join(', ');
            },
            onRoomChange(rooms) {
                this.rooms = rooms;
            }
        },
        async mounted() {
            this.rooms = await matrixService.getRooms() || [];
            this.canUseEncryption = matrixService.isEncryptionEnabled();
            this.newRoomEncrypted = this.canUseEncryption;
            this.loggedInUserFull = await matrixService.getUsername(true);
            this.loggedInUser = await matrixService.getUsername();
            matrixService.onRoomChange(this.onRoomChange);
        },
        beforeDestroy() {
            matrixService.onRoomChange(null);
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}

.actionBtn {
    margin: 0;
    padding: 0.25em;
    line-height: 1;
}
</style>