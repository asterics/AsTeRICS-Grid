class MatrixConfigSync {
    /**
     * @param {Object} data
     * @param {string} data.user full matrix user name, e.g. @user:matrix.org
     * @param {string} data.password password for matrix account
     */
    constructor(data = {}) {
        this.user = data.user;
        this.password = data.password;
    }
}

export { MatrixConfigSync };