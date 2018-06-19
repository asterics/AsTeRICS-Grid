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
    return typeof jsonStringOrObject === 'string' ? JSON.parse(jsonStringOrObject): jsonStringOrObject;
};

/**
 * sets properties of a base object to an property object, if property is not existing on property object. To be used
 * in constructor of model objects.
 *
 * @param propertyObject the object containing properties passed to the constructor
 * @param baseObject second, optional object passed to the constructor containing an old instance of the model. It is
 * used to set properties that are not set in the properties object.
 * @param modelClass the class of the model that is created
 * @return the property object with additional properties of the baseObject
 */
modelUtil.setDefaults = function (propertyObject, baseObject, modelClass) {
    if (baseObject && propertyObject && modelClass && modelClass.definition) {
        var neededParams = Object.keys(modelClass.definition)
        Object.keys(baseObject).forEach(function (key) {
            if (neededParams.includes(key) && propertyObject[key] == undefined) {
                propertyObject[key] = baseObject[key];
            }
        });
    }
    return propertyObject;
};

export {modelUtil};