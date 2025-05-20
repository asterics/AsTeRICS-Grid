<template>
    <div>
        <span v-if="isPrivateRoom(room)">{{ $t('privateRoomWith', { user: getPrivateRoomPartner(room) }) }}</span>
        <span v-if="!isPrivateRoom(room) && room.getMembers().length < 10">
            <strong :class="full ? 'd-inline' : 'd-sm-none d-inline'">{{ $t('members') }}:</strong>
            <span>{{ getAllMembersString(room) }}</span>
        </span>
        <span v-if="!isPrivateRoom(room) && room.getMembers().length >= 10">
            <span>{{ room.getMembers().length }}</span>
            <span>{{ $t('members') }}</span>
        </span>
    </div>
</template>

<script>
import '../../css/modal.css';

export default {
    components: {},
    props: ["room", "full", "loggedInUser"],
    data: function () {
        return {
        }
    },
    methods: {
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
    },
    async mounted() {
    }
}
</script>

<style scoped>
</style>