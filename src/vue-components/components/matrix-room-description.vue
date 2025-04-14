<template>
    <div>
        <span v-if="isPrivateRoom(room)">{{ $t('privateRoomWith', { user: getPrivateRoomPartner(room) }) }}</span>
        <strong :class="full ? 'd-inline' : 'd-sm-none d-inline'" v-if="!isPrivateRoom(room)">{{ $t('members') }}:</strong>
        <span v-if="!isPrivateRoom(room)">{{ getAllMembersString(room) }}</span>
    </div>
</template>

<script>
import '../../css/modal.css';

export default {
    components: {},
    props: ["room", "full"],
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