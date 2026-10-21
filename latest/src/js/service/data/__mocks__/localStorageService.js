let localStorageService = {};

const SOME_USERNAME = "some_user";

localStorageService.getAutologinOrActiveUser = function (object) {
    return SOME_USERNAME;
};

localStorageService.getSavedUsers = function() {
    return [];
}

localStorageService.getJSON = function() {
    return [];
}

localStorageService.saveJSON = function() {
}

export { localStorageService };