var storage = null;
if (typeof(Storage) !== "undefined") {
    var storage = window.localStorage;
}

var localStorageService = {
    save: function(key, value) {
        if(storage) {
            return storage.setItem(key, value);
        }
    },
    get: function (key) {
        if(storage) {
            return storage.getItem(key);
        }
    }
};

export {localStorageService};