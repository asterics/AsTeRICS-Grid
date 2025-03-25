class MatrixMessage {
    /**
     * @param {Object} data
     * @param {string} data.msgType
     * @param {string} data.textContent
     * @param {string} data.sender
     * @param {string} data.senderId
     * @param {string} data.isDeleted
     * @param {string} data.imageUrl
     * @param {string} data.roomId
     */
    constructor(data = {}) {
        this.msgType = data.msgType;
        this.textContent = data.textContent;
        this.sender = data.sender;
        this.senderId = data.senderId;
        this.isDeleted = data.isDeleted;
        this.imageUrl = data.imageUrl;
        this.roomId = data.roomId;
    }
}

export { MatrixMessage };