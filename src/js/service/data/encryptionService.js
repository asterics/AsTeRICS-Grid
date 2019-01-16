import sjcl from 'sjcl';

import {EncryptedObject} from "../../model/EncryptedObject";
import {localStorageService} from "./localStorageService";
import {dataUtil} from "../../util/dataUtil";

let encryptionService = {};
let _encryptionSalt = null;
let _encryptionKey = 'test';
let _cryptoTime = 0;

/**
 * encrypts a given object
 * @see{EncryptedObject}
 *
 * @param object any model object to encrypt
 * @param options map of options, can contain:
 *        encryption key: the key that should be used for encryption (optional, local _encryptionKey variable is used
 *        if not set)
 * @return {*} encrypted object of type @see{EncryptedObject}
 */
encryptionService.encryptObject = function (object, options) {
    if (!object) {
        return object;
    }
    options = options || {};

    let encryptedObject = new EncryptedObject({
        id: object.id,
        modelName: object.modelName
    });
    encryptedObject._id = object.id;
    encryptedObject._rev = object._rev;
    let jsonString = JSON.stringify(object);
    let shortJsonString = JSON.stringify(dataUtil.removeLongPropertyValues(object));
    encryptedObject.encryptedDataBase64 = encryptionService.encryptString(jsonString, options.encryptionKey);
    encryptedObject.encryptedDataBase64Short = encryptionService.encryptString(shortJsonString, options.encryptionKey);
    return encryptedObject;
};

/**
 * Decrypts one ore more given encrypted objects
 * @see{EncryptedObject}
 *
 * @param encryptedObjects an array of encrypted objects or a single encrypted object
 * @param options map of options, can contain:
 *        onlyShortVersion: if true only the short version (with stripped binary data) is decrypted and returned
 *        objectType: the type of the objects to decrypt
 *        encryption key: the key that should be used for encryption (optional, local _encryptionKey variable is used
 *        if not set)
 * @return {*} an array or single object (depending on input) of decrypted instances of objects of type "objectType"
 */
encryptionService.decryptObjects = function (encryptedObjects, options) {
    if (!encryptedObjects) {
        return encryptedObjects;
    }
    options = options || {};
    let objectType = options.objectType;
    let onlyShortVersion = options.onlyShortVersion;

    encryptedObjects = encryptedObjects instanceof Array ? encryptedObjects : [encryptedObjects];
    let decryptedObjects = [];
    encryptedObjects.forEach(encryptedObject => {
        let decryptedString =  null;
        let decryptedObject = null;
        if(onlyShortVersion) {
            decryptedString = encryptionService.decryptString(encryptedObject.encryptedDataBase64Short, options.encryptionKey);
            decryptedObject = JSON.parse(decryptedString);
            decryptedObject.isShortVersion = true;
        } else {
            decryptedString = encryptionService.decryptString(encryptedObject.encryptedDataBase64, options.encryptionKey);
            decryptedObject = JSON.parse(decryptedString);
        }
        decryptedObject = objectType ? new objectType(decryptedObject) : decryptedObject;
        decryptedObject._id = encryptedObject._id;
        decryptedObject._rev = encryptedObject._rev;
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
    let encryptedString = null;
    if (encryptionKey) {
        encryptedString =  sjcl.encrypt(encryptionKey, string, {iter: 1000});
    } else {
        encryptedString = btoa(string);
    }
    return encryptedString;
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
    let decryptedString = null;
    let startTime = new Date().getTime();
    if (encryptionKey) {
        decryptedString = sjcl.decrypt(encryptionKey, encryptedString);
    } else {
        decryptedString = atob(encryptedString);
    }
    /*if(_cryptoTime === 0) {
        setTimeout(function () {
            alert(_cryptoTime);
            _cryptoTime = 0;
        }, 5000);
    }*/
    _cryptoTime += new Date().getTime() - startTime;
    log.warn(_cryptoTime + ', this:' + (new Date().getTime() - startTime));
    return decryptedString;
};

/**
 * returns a cryptographic hash of a string
 * @param string the string to hash
 */
encryptionService.getStringHash = function (string) {
    return btoa(string); //TODO: use real hash function
};

/**
 * hashes a password, uses the local _encryption salt to salt it before hashing
 * @param plaintextPassword the plaintext password to hash
 */
encryptionService.getPasswordHash = function (plaintextPassword) {
    return encryptionService.getStringHash('' + _encryptionSalt + plaintextPassword);
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
    _encryptionKey = localStorageService.getUserPassword() || _encryptionKey;
    log.warn('encryption key is: ' + _encryptionKey);
};

export {encryptionService};