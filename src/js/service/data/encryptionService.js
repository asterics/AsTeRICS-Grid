import {EncryptedObject} from "../../model/EncryptedObject";
import {localStorageService} from "./localStorageService";

let ENCRYPTION_KEY = "ENCRYPTION_KEY";
let encryptionService = {};
let _encryptionSalt = null;
let _encryptionKey = null;

/**
 * encrypts a given object
 * @see{EncryptedObject}
 *
 * @param object any model object to encrypt
 * @return {*} encrypted object of type @see{EncryptedObject}
 */
encryptionService.encryptObject = function (object, encryptionKey) {
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
 * Decrypts one ore more given encrypted objects
 * @see{EncryptedObject}
 *
 * @param encryptedObjects an array of encrypted objects or a single encrypted object
 * @param objectType the type of the objects to decrypt
 * @return {*} an array or single object (depending on input) of decrypted instances of objects of type "objectType"
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

/**
 * sets the salt that is used for encryption purposes
 * @param salt
 */
encryptionService.setEncryptionSalt = function (salt) {
    log.warn('encryption salt is: ' + salt);
    _encryptionSalt = salt;
    encryptionService.reloadEncryptionKey();
};

/**
 * reloads the encryption key from localStorage
 */
encryptionService.reloadEncryptionKey = function () {
    _encryptionKey = localStorageService.get(ENCRYPTION_KEY);
    log.warn('encryption key is: ' + _encryptionKey);
};

export {encryptionService};