let DEFAULT_HOMESERVER = "https://matrix.org";

class MatrixConfigSync {
    /**
     * @param {Object} data
     * @param {string} data.homeserver matrix homeserver, defaults to "https://matrix.org"
     * @param {string} data.user matrix username, e.g. @user:matrix.org or just "user"
     * @param {string} data.password password for matrix account
     */
    constructor(data = {}) {
        this.homeserver = data.homeserver || DEFAULT_HOMESERVER;
        this.user = data.user;
        this.password = data.password;
    }
}

export { MatrixConfigSync };