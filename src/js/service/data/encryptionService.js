import {EncryptedObject} from "../../model/EncryptedObject";
import {localStorageService} from "./localStorageService";

let ENCRYPTION_PASSWORD_KEY = "ENCRYPTION_PASSWORD_KEY";
let encryptionService = {};
let _encryptionSalt = null;
let _encryptionPassword = null;

/**
 *
 * @param object
 */
encryptionService.encryptObject = function (object) {
    if(!object) {
        return object;
    }
    let encryptedObject = new EncryptedObject({
        id: object.id,
        modelName: object.modelName
    });
    encryptedObject._id = object.id;
    encryptedObject.encryptedDataBase64 = btoa(JSON.stringify(object));
    return encryptedObject;
};

/**
 *
 * @param encryptedObject
 * @param objectType
 */
encryptionService.decryptObjects = function (encryptedObjects, objectType) {
    if(!encryptedObjects) {
        return encryptedObjects;
    }
    encryptedObjects = encryptedObjects instanceof Array ? encryptedObjects: [encryptedObjects];
    let decryptedObjects = [];
    encryptedObjects.forEach(encryptedObject => {
       let decryptedObject = JSON.parse(atob(encryptedObject.encryptedDataBase64));
       decryptedObject = objectType ? new objectType(decryptedObject) : decryptedObject;
       decryptedObjects.push(decryptedObject);
    });

    return decryptedObjects.length > 1 ? decryptedObjects : decryptedObjects[0];
};

encryptionService.setEncryptionSalt = function (salt) {
    log.warn('encryption salt is: ' + salt);
    _encryptionSalt = salt;
    encryptionService.reloadEncryptionPassword();
};

encryptionService.reloadEncryptionPassword = function () {
    _encryptionPassword = localStorageService.get(ENCRYPTION_PASSWORD_KEY);
    log.warn('encryption password is: ' + _encryptionPassword);
};

export {encryptionService};