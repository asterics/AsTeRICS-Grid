var errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
var storage = null;
let FIRST_VISIT_KEY = 'FIRST_VISIT_KEY';
let USER_PASSWORDS_KEY = "USER_PASSWORDS_KEY";
let LAST_ACTIVEUSER_KEY = "LAST_ACTIVEUSER_KEY";

if (typeof (Storage) !== "undefined") {
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
    remove: function (key) {
        if (storage) {
            try {
                return storage.removeItem(key);
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
     * @param username the username as used for login
     * @return {*}
     */
    getUserPassword(username) {
        if (!username) {
            return null;
        }
        return getPasswordObject()[username];
    },
    /**
     * saves a given user password
     * @param username the username as used for login
     * @param password the password to save (should be salted + hashed)
     */
    saveUserPassword(username, password) {
        let object = getPasswordObject();
        object[username] = password;
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
    },
    /**
     * removes a saved password of a given user from local storage
     * @param username the username as used for login
     */
    removeUserPassword(username) {
        let object = getPasswordObject();
        delete object[username];
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
    },
    /**
     * returns all users with saved passwords as a string list
     */
    getSavedUsers() {
        let object = getPasswordObject();
        return Object.keys(object);
    },
    /**
     * saves the last active user by username
     */
    setLastActiveUser(username) {
        localStorageService.save(LAST_ACTIVEUSER_KEY, username);
    },
    /**
     * retrieves the last active user
     */
    getLastActiveUser() {
        return localStorageService.get(LAST_ACTIVEUSER_KEY);
    }
};

function getPasswordObject() {
    let passwordsObjectString = localStorageService.get(USER_PASSWORDS_KEY);
    if (!passwordsObjectString) {
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify({}));
        return {};
    }
    return JSON.parse(passwordsObjectString);
}

export {localStorageService};