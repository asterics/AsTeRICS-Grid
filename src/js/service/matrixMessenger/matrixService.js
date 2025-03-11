import { matrixAdapter } from './matrixAdapter';
import * as Matrix from 'matrix-js-sdk';

let matrixService = {};

matrixService.getUserId = function() {
    return matrixAdapter.getUserId();
}

matrixService.login = function() {
    return matrixAdapter.login();
}

matrixService.logout = function() {
    return matrixAdapter.logout();
}

matrixService.onMessage = function(callback) {
    _messageCallback = callback;
}

matrixService.sendMessage = async function(roomId, message) {
    return await matrixAdapter.doWithClient(client => {
        const messageContent = {
            body: message,
            msgtype: 'm.text'
        };
        log.warn("send to roomId", roomId);
        client.sendEvent(roomId, Matrix.EventType.RoomMessage, messageContent, '', (err, res) => {
            console.log(err);
        });
    });
}

matrixService.getRooms = async function() {
    log.warn("GET ROOMS1");
    return await matrixAdapter.doWithClient(client => {
        log.warn("GET ROOMS");
        return client.getRooms();
    });
};

matrixService.getMessageEvents = async function(roomId, pastMessages = 10) {
    return await matrixAdapter.doWithClient(async client => {
        let room = client.getRooms().find(room => room.roomId === roomId);
        if (!room) {
            return;
        }
        let timeline = room.getLiveTimeline();
        if (pastMessages) {
            await client.paginateEventTimeline(timeline, {
                backwards: true,
                limit: pastMessages
            });
        }

        // decrypt
        for (const event of timeline.getEvents()) {
            if (event.getType() === Matrix.EventType.RoomMessageEncrypted) {
                await client.decryptEventIfNeeded(event);
            }
        }

        return timeline.getEvents().filter(e => e.getType() === Matrix.EventType.RoomMessage && !e.isDecryptionFailure());
    });
}

matrixService.existsUser = async function(config) {
    return await matrixAdapter.doWithClient(async client => {
        try {
            await client.getProfileInfo(getFullUser(config)); // TODO: fix
            return true;
        } catch (error) {
        }
        return false;
    });

}

matrixService.addPrivateRoom = async function createRoomWithUser(username) {
    try {
        // Step 1: Create a room with basic settings
        let fullUser = getFullUser(username); // TODO: fix
        const roomOptions = {
            visibility: 'private',  // Set visibility (private or public)
            invite: [fullUser],      // Invite a single user to the room
            enable_encryption: true
        };

        const roomResponse = await _matrixClient.createRoom(roomOptions);
        return roomResponse.room_id;  // Return room ID for further use
    } catch (error) {
        console.error('Error creating room or inviting user:', error);
    }
    return null;
}

matrixService.acceptAllInvites = async function() {
    if (!_loginPromise) {
        return;
    }
    await _loginPromise;
    const rooms = _matrixClient.getRooms();
    for (const room of rooms) {
        if (room.getMyMembership() === "invite") {
            console.log(`Accepting invite for room: ${room.roomId}`);
            try {
                await _matrixClient.joinRoom(room.roomId);
                console.log(`Successfully joined room: ${room.name}, ${room.roomId}`);
            } catch (error) {
                console.error(`Failed to join room ${room.name}, ${room.roomId}:`, error);
            }
        }
    }
}

export { matrixService };