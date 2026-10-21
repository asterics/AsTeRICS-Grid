class MatrixConfigLocal {
    /**
     * @param {Object} data
     * @param {string} data.homeserver matrix homeserver used for currently logged-in username (locally on this device, set after successful login using data from MatrixConfigSync)
     * @param {string} data.user logged-in username (locally on this device, set after successful login using data from MatrixConfigSync)
     * @param {string} data.accessToken access token for the current login/device
     * @param {string} data.deviceId device ID of the current device
     * @param {string} data.useCrypto true if crypto is enabled for the current config
     */
    constructor(data = {}) {
        this.homeserver = data.homeserver;
        this.user = data.user;
        this.accessToken = data.accessToken;
        this.deviceId = data.deviceId;
        this.useCrypto = data.useCrypto || false;
    }
}

export { MatrixConfigLocal };