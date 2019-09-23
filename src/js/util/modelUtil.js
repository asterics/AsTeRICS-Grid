import {constants} from "./constants";

var modelUtil = {};
var idCounter = 100;
let _currentModelVersion = JSON.parse(constants.MODEL_VERSION);
let _emptyVersionObject = {
    major: null,
    minor: null,
    patch: null
};

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
 * model to get a new (unique) name for labels
 * @param baseName the new label
 * @param existingNames existing labels
 * @return a new label that is non-conflicting with existingLabels.
 * e.g. if baseName == 'grid' and existingNames.includes('grid'), 'grid (1)' will be returned.
 */
modelUtil.getNewName = function (baseName, existingNames) {
    var i = 1;
    var returnName = baseName;
    while (existingNames.includes(returnName)) {
        returnName = baseName +' (' + i + ')';
        i++;
    }
    return returnName;
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

/**
 * returns a simple hash code for a given modelItem. The id and revision is removed before hashing.
 * @param modelItem
 */
modelUtil.hashCode = function (modelItem) {
    modelItem = modelItem || {};
    var plainObject = JSON.parse(JSON.stringify(modelItem));
    delete plainObject._rev;
    delete plainObject._id;
    delete plainObject.id;
    var str = JSON.stringify(plainObject);
    return str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
};

/**
 * returns the current, latest model version as string (JSON)
 * @return {string}
 */
modelUtil.getModelVersionString = function () {
    return constants.MODEL_VERSION;
};

/**
 * returns the modelVersion information as object, containing propterties "major", "minor" and "patch" as Integer values
 * @param modelVersionString the modelVersionString to parse
 * @return {*}
 */
modelUtil.getModelVersionObject = function(modelVersionString) {
    if(!modelVersionString) {
        return _emptyVersionObject;
    }
    let json = JSON.parse(modelVersionString);
    if(json.major) {
        json.major = parseInt(json.major);
        json.minor = parseInt(json.minor);
        json.patch = parseInt(json.patch);
    }
    return json.major ? json: _emptyVersionObject;
};

/**
 * returns the latest/current model version
 * @return {*}
 */
modelUtil.getLatestModelVersion = function() {
    return _currentModelVersion;
};

export {modelUtil};