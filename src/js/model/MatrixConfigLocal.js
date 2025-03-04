class MatrixConfigLocal {
    /**
     * @param {Object} data
     * @param {string} data.accessToken access token for the current login/device
     * @param {string} data.deviceId device ID of the current device
     */
    constructor(data = {}) {
        this.accessToken = data.accessToken;
        this.deviceId = data.deviceId;
    }
}

export { MatrixConfigLocal };