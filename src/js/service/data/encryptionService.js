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
 * @param encryptionKey the key that should be used for encryption (optional, local _encryptionKey variable is used
 *        if not set)
 * @return {*} encrypted object of type @see{EncryptedObject}
 */
encryptionService.encryptObject = function (object, encryptionKey) {
    if (!object) {
        return object;
    }

    let encryptedObject = new EncryptedObject({
        id: object.id,
        modelName: object.modelName
    });
    encryptedObject._id = object.id;
    let jsonString = JSON.stringify(object);
    encryptedObject.encryptedDataBase64 = encryptionService.encryptString(jsonString, encryptionKey);
    return encryptedObject;
};

/**
 * Decrypts one ore more given encrypted objects
 * @see{EncryptedObject}
 *
 * @param encryptedObjects an array of encrypted objects or a single encrypted object
 * @param objectType the type of the objects to decrypt
 * @param encryptionKey the key that should be used for decryption (optional, local _encryptionKey variable is used
 *        if not set)
 * @return {*} an array or single object (depending on input) of decrypted instances of objects of type "objectType"
 */
encryptionService.decryptObjects = function (encryptedObjects, objectType, encryptionKey) {
    if (!encryptedObjects) {
        return encryptedObjects;
    }

    encryptedObjects = encryptedObjects instanceof Array ? encryptedObjects : [encryptedObjects];
    let decryptedObjects = [];
    encryptedObjects.forEach(encryptedObject => {
        let decryptedString = encryptionService.decryptString(encryptedObject.encryptedDataBase64, encryptionKey);
        let decryptedObject = JSON.parse(decryptedString);
        decryptedObject = objectType ? new objectType(decryptedObject) : decryptedObject;
        decryptedObjects.push(decryptedObject);
    });

    return decryptedObjects.length > 1 ? decryptedObjects : decryptedObjects[0];
};

/**
 * encrypts a string and returns a base64 representation of the encrypted data.
 *
 * @param string the string to encrypt
 * @param encryptionKey the key that should be used for encryption (optional, local _encryptionKey variable is used
 *        if not set). If no encryption key is set in both, this method just encodes the given string to base64.
 * @return {string} the given string in encrypted form, encoded in base64
 */
encryptionService.encryptString = function (string, encryptionKey) {
    encryptionKey = encryptionKey || _encryptionKey;
    let encryptedString = string;
    if (encryptionKey) {
        //TODO encrypt
    }
    return btoa(encryptedString);
};

/**
 * decrypts a given base64 encoded string.
 *
 * @param encryptedString a base64 encoded string that was encrypted before
 * @param encryptionKey the key that should be used for decryption (optional, local _encryptionKey variable is used
 *        if not set). If no encryption key is set in both, this method just decodes a given base64 encoded string.
 * @return {string} the decrypted string, not base64 encoded
 */
encryptionService.decryptString = function (encryptedString, encryptionKey) {
    encryptionKey = encryptionKey || _encryptionKey;
    let decryptedString = atob(encryptedString);
    if (encryptionKey) {
        //TODO decrypt
    }
    return decryptedString;
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