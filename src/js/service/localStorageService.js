var errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
var storage = null;
if (typeof(Storage) !== "undefined") {
    try {
        var storage = window.localStorage;
    } catch (e) {
        console.log(errorMsg + e)
    }
}

var localStorageService = {
    save: function (key, value) {
        if (storage) {
            try {
                return storage.setItem(key, value);
            } catch (e) {
                console.log(errorMsg + e)
            }
        }
    },
    get: function (key) {
        if (storage) {
            try {
                return storage.getItem(key);
            } catch (e) {
                console.log(errorMsg + e)
            }
        }
    }
};

export {localStorageService};