var errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
var storage = null;
let FIRST_VISIT_KEY = 'FIRST_VISIT_KEY';
let USER_PASSWORD = "USER_PASSWORD";

if (typeof(Storage) !== "undefined") {
    try {
        var storage = window.localStorage;
    } catch (e) {
        log.error(errorMsg + e)
    }
}

var localStorageService = {
    save: function (key, value) {
        if (storage) {
            try {
                return storage.setItem(key, value);
            } catch (e) {
                log.error(errorMsg + e)
            }
        }
    },
    get: function (key) {
        if (storage) {
            try {
                return storage.getItem(key);
            } catch (e) {
                log.error(errorMsg + e)
            }
        }
    },
    /**
     * returns true if the page was never visited before and this method was never called before.
     * returns false afterwards.
     * @return {boolean}
     */
    isFirstPageVisit() {
        let value = localStorageService.get(FIRST_VISIT_KEY);
        localStorageService.save(FIRST_VISIT_KEY, true);
        return !value;
    },
    /**
     * returns a previously saved user password
     * @return {*}
     */
    getUserPassword() {
        return localStorageService.get(USER_PASSWORD);
    },
    /**
     * saves a given user password
     * @param password the password to save (should be salted + hashed)
     * @return {boolean}
     */
    saveUserPassword(password) {
        let value = localStorageService.save(USER_PASSWORD, password);
        return !value;
    }
};

export {localStorageService};