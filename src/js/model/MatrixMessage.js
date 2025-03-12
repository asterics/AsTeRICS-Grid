class MatrixMessage {
    /**
     * @param {Object} data
     * @param {string} data.msgType
     * @param {string} data.textContent
     * @param {string} data.sender
     * @param {string} data.isDeleted
     * @param {string} data.imageUrl
     */
    constructor(data = {}) {
        this.msgType = data.msgType;
        this.textContent = data.textContent;
        this.sender = data.sender;
        this.isDeleted = data.isDeleted;
        this.imageUrl = data.imageUrl;
        this.roomId = data.roomId;
    }
}

export { MatrixMessage };