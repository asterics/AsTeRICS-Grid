import { EncryptedObject } from '../../model/EncryptedObject';
import { dataUtil } from '../../util/dataUtil';
import { sjcl } from '../../externals/sjcl';
import { log } from '../../util/log.js';
import { MapCache } from '../../util/MapCache';
import { webCryptoService } from './webCryptoService';

let STATIC_USER_PW_SALT = 'STATIC_USER_PW_SALT';

let encryptionService = {};
let _encryptionSalts = null;
let _encryptionBasePassword = null;
let _isLocalUser = false;
let _decryptionCache = new MapCache();
let _hashCache = new MapCache();

let _cryptoTime = 0;
let _operationStartTime = null;

// Flag to use WebCrypto API (default true if available)
let _useWebCrypto = webCryptoService.isAvailable();

/**
 * encrypts a given object
 * @see{EncryptedObject}
 *
 * @param object any model object to encrypt
 * @return {Promise<*>} encrypted object of type @see{EncryptedObject}
 */
encryptionService.encryptObject = async function (object) {
    throwErrorIfUninitialized();
    if (!object) {
        return object;
    }

    let encryptedObject = new EncryptedObject({
        id: object.id,
        modelName: object.modelName
    });
    encryptedObject._id = object.id;
    if (object._rev) {
        encryptedObject._rev = object._rev;
    }
    let jsonString = JSON.stringify(object);
    let shortJsonString = JSON.stringify(dataUtil.removeLongPropertyValues(object));
    let shortVersionDifferent = jsonString !== shortJsonString;
    encryptedObject.encryptedDataBase64 = await encryptionService.encryptString(jsonString, _encryptionSalts[0]);
    encryptedObject.encryptedDataBase64Short = shortVersionDifferent
        ? await encryptionService.encryptString(shortJsonString, _encryptionSalts[0])
        : null;
    return encryptedObject;
};

/**
 * Decrypts one ore more given encrypted objects
 * @see{EncryptedObject}
 *
 * @param encryptedObjects an array of encrypted objects or a single encrypted object
 * @param options map of options, can contain:
 *        onlyShortVersion: if true only the short version (with stripped binary data) is decrypted and returned
 * @return {Promise<*>} an array or single object (depending on input) of decrypted instances of objects
 */
encryptionService.decryptObjects = async function (encryptedObjects, options) {
    throwErrorIfUninitialized();
    if (!encryptedObjects) {
        return encryptedObjects;
    }

    options = options || {};
    let onlyShortVersion = options.onlyShortVersion;

    encryptedObjects = encryptedObjects instanceof Array ? encryptedObjects : [encryptedObjects];
    let decryptedObjects = [];

    for (const encryptedObject of encryptedObjects) {
        try {
            let decryptedString = null;
            let decryptedObject = null;
            if (onlyShortVersion) {
                let toDecrypt = encryptedObject.encryptedDataBase64Short || encryptedObject.encryptedDataBase64;
                decryptedString = await encryptionService.decryptStringTrySalts(toDecrypt, _encryptionSalts);
                decryptedObject = JSON.parse(decryptedString);
                decryptedObject.isShortVersion = true;
            } else {
                decryptedString = await encryptionService.decryptStringTrySalts(
                    encryptedObject.encryptedDataBase64,
                    _encryptionSalts
                );
                decryptedObject = JSON.parse(decryptedString);
            }
            decryptedObject._id = encryptedObject._id;
            decryptedObject._rev = encryptedObject._rev;
            decryptedObjects.push(decryptedObject);
        } catch (e) {
            log.error('error decrypting object: ' + encryptedObject.modelName + ', id: ' + encryptedObject.id);
            log.error(e);
        }
    }

    return decryptedObjects.length > 1 ? decryptedObjects : decryptedObjects[0];
};

/**
 * encrypts a string and returns a base64 representation of the encrypted data.
 * Uses WebCrypto API by default, falls back to SJCL if unavailable.
 *
 * @param string the string to encrypt
 * @param encryptionSalt the salt that should be used to encrypt, base encryption key is used from _encryptionBasePassword
 * @return {Promise<string>} the given string in encrypted form, encoded in base64
 */
encryptionService.encryptString = async function (string, encryptionSalt) {
    throwErrorIfUninitialized();
    let encryptionKey = getEncryptionKey(encryptionSalt);
    let encryptedString = null;

    if (encryptionKey && !_isLocalUser) {
        // Use WebCrypto if available, otherwise fall back to SJCL
        if (_useWebCrypto && webCryptoService.isAvailable()) {
            try {
                encryptedString = await webCryptoService.encrypt(string, encryptionSalt, encryptionKey);
                log.debug('Encrypted using WebCrypto API');
            } catch (e) {
                log.warn('WebCrypto encryption failed, falling back to SJCL', e);
                encryptedString = sjcl.encrypt(encryptionKey, string, { iter: 1000 });
            }
        } else {
            encryptedString = sjcl.encrypt(encryptionKey, string, { iter: 1000 });
        }
    } else {
        encryptedString = string;
    }
    return encryptedString;
};

/**
 * decrypts a given base64 encoded string.
 * Automatically detects format (WebCrypto or SJCL) and uses appropriate decryption.
 *
 * @param encryptedString a base64 encoded string that was encrypted before
 * @param encryptionSalt the salt that should be used to encrypt, base encryption key is used from _encryptionBasePassword
 * @return {Promise<string>} the decrypted string, not base64 encoded
 */
encryptionService.decryptString = async function (encryptedString, encryptionSalt) {
    throwErrorIfUninitialized();
    if (_decryptionCache.has(encryptedString)) {
        log.debug('using decryption cache...');
        return _decryptionCache.get(encryptedString);
    }

    let encryptionKey = getEncryptionKey(encryptionSalt);
    let decryptedString = null;
    let startTime = new Date().getTime();

    if (encryptionKey && !_isLocalUser) {
        // Detect format and use appropriate decryption
        if (webCryptoService.isWebCryptoFormat(encryptedString)) {
            try {
                decryptedString = await webCryptoService.decrypt(encryptedString, encryptionSalt, encryptionKey);
                log.debug('Decrypted using WebCrypto API');
            } catch (e) {
                log.error('WebCrypto decryption failed', e);
                throw e;
            }
        } else {
            // Legacy SJCL format
            decryptedString = sjcl.decrypt(encryptionKey, encryptedString);
            log.debug('Decrypted using SJCL (legacy format)');
        }
    } else {
        try {
            decryptedString = encryptedString;
            let parsed = JSON.parse(decryptedString);
            // Check if it's encrypted SJCL format
            if (parsed.iv && parsed.cipher && parsed.ct) {
                decryptedString = sjcl.decrypt(encryptionKey, encryptedString);
            } else if (parsed.v === 2 && parsed.iv && parsed.ct) {
                // WebCrypto format
                decryptedString = await webCryptoService.decrypt(encryptedString, encryptionSalt, encryptionKey);
            }
        } catch (e) {
            // Try SJCL as fallback
            try {
                decryptedString = sjcl.decrypt(encryptionKey, encryptedString);
            } catch (sjclError) {
                log.error('All decryption methods failed', e, sjclError);
                throw sjclError;
            }
        }
    }

    _decryptionCache.set(encryptedString, decryptedString);
    return decryptedString;
};

encryptionService.decryptStringTrySalts = async function (encryptedString, trySalts) {
    try {
        trySalts = JSON.parse(JSON.stringify(trySalts));
        return await encryptionService.decryptString(encryptedString, trySalts.shift());
    } catch (e) {
        if (trySalts.length === 0) {
            log.error("wasn't able to decrypt string, no remaining salts for trying!");
            throw e;
        }
        log.warn("wasn't able to decrypt string, try next salt...", trySalts[0]);
        return await encryptionService.decryptStringTrySalts(encryptedString, trySalts);
    }
};

/**
 * returns a cryptographic hash of a string (SHA-256)
 * Uses WebCrypto API if available, falls back to SJCL for compatibility
 * @param string the string to hash
 * @return {Promise<string>|string} hex-encoded hash (async if WebCrypto, sync if SJCL)
 */
encryptionService.getStringHash = function (string) {
    if (_hashCache.has(string)) {
        return _hashCache.get(string);
    }

    // Use SJCL for hash to maintain compatibility with existing hashes
    // WebCrypto SHA-256 produces same result but we keep SJCL for consistency
    let bitArray = sjcl.hash.sha256.hash(string);
    let hash = sjcl.codec.hex.fromBits(bitArray);
    _hashCache.set(string, hash);
    return hash;
};

/**
 * hashes a user password, uses the STATIC_USER_PW_SALT to salt it before hashing.
 * salt of user password has to be static in order to be able to compute the same hash
 * from a given user plaintext password on different devices, before any data was exchanged.
 * the result of this function is used in order to login to remote couchdb.
 *
 * @param plaintextPassword the plaintext password to hash
 */
encryptionService.getUserPasswordHash = function (plaintextPassword) {
    return encryptionService.getStringHash(STATIC_USER_PW_SALT + plaintextPassword);
};

/**
 * sets the encryption properties
 * @param hashedPassword the hashed user password
 * @param salts array of salts to use -> ID(s) of metadata object(s)
 */
encryptionService.setEncryptionProperties = function (hashedPassword, salts, isLocalUser) {
    hashedPassword = hashedPassword || '';
    _encryptionBasePassword = hashedPassword;
    _encryptionSalts = Array.isArray(salts) ? salts : [salts];
    _isLocalUser = isLocalUser;
    _decryptionCache.clearAll();
    _hashCache.clearAll();
};

function getEncryptionKey(salt) {
    return encryptionService.getStringHash('' + salt + _encryptionBasePassword);
}

/**
 * clears the encryption properties
 */
encryptionService.resetEncryptionProperties = function () {
    log.debug('reset encryption properties...');
    _encryptionSalts = null;
    _encryptionBasePassword = null;
    _isLocalUser = false;
};

/**
 * Enables or disables WebCrypto API usage
 * @param {boolean} useWebCrypto - true to use WebCrypto, false to use SJCL
 */
encryptionService.setUseWebCrypto = function (useWebCrypto) {
    _useWebCrypto = useWebCrypto && webCryptoService.isAvailable();
    log.debug('WebCrypto usage set to: ' + _useWebCrypto);
};

/**
 * Returns whether WebCrypto is currently enabled
 * @return {boolean} true if WebCrypto is enabled and available
 */
encryptionService.isUsingWebCrypto = function () {
    return _useWebCrypto && webCryptoService.isAvailable();
};

function throwErrorIfUninitialized() {
    if (!_encryptionBasePassword || !_encryptionSalts || _encryptionSalts.length === 0) {
        let msg = 'using encryptionService uninitialized is not possible, aborting...';
        log.error(msg);
        throw msg;
    }
}

export { encryptionService };
