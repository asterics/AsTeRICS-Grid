var modelUtil = {};
var idCounter = 1;

modelUtil.generateId = function (prefix) {
    prefix = prefix || "id";
    return prefix + "-" + new Date().getTime() + "-" + (idCounter++);
};

/**
 * method for parsing a json string to a JS object, if given parameter is string. Otherwise the given parameter is
 * supposed to be already an object and is returned without change.
 *
 * @param jsonStringOrObject
 * @return {*}
 */
modelUtil.getAsObject = function (jsonStringOrObject) {
    return typeof jsonData === 'string' ? JSON.parse(jsonStringOrObject): jsonStringOrObject;
};

export {modelUtil};