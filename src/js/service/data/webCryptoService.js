/**
 * WebCrypto-based encryption service
 * Provides AES-GCM encryption using the native Web Crypto API for better performance
 * and security compared to pure JavaScript implementations like SJCL.
 *
 * Format Version: 2 (WebCrypto format)
 * Encryption: AES-GCM-256
 * Key Derivation: PBKDF2 with SHA-256
 */

const CRYPTO_VERSION = 2;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const PBKDF2_ITERATIONS = 100000; // Industry standard in 2025
const SALT_LENGTH = 16;

let webCryptoService = {};

/**
 * Gets the crypto object (works in both browser and Node.js environments)
 * @return {Crypto|undefined} crypto object or undefined if not available
 */
function getCrypto() {
    if (typeof window !== 'undefined' && window.crypto) {
        return window.crypto;
    }
    if (typeof global !== 'undefined' && global.crypto) {
        return global.crypto;
    }
    if (typeof crypto !== 'undefined') {
        return crypto;
    }
    return undefined;
}

/**
 * Checks if Web Crypto API is available
 * @return {boolean} true if crypto.subtle is available
 */
webCryptoService.isAvailable = function() {
    const cryptoObj = getCrypto();
    return typeof cryptoObj !== 'undefined' &&
           typeof cryptoObj.subtle !== 'undefined';
};

/**
 * Converts ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @return {string} base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 * @param {string} base64
 * @return {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Derives a cryptographic key from password and salt using PBKDF2
 * @param {string} password - The password/key to derive from
 * @param {string} salt - Salt value
 * @return {Promise<CryptoKey>} The derived key
 */
async function deriveKey(password, salt) {
    const cryptoObj = getCrypto();
    const encoder = new TextEncoder();
    const keyMaterial = await cryptoObj.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return cryptoObj.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Checks if a string is in WebCrypto format
 * @param {string} str - The string to check
 * @return {boolean} true if the string is in WebCrypto format
 */
webCryptoService.isWebCryptoFormat = function(str) {
    if (!str || typeof str !== 'string') {
        return false;
    }
    try {
        const parsed = JSON.parse(str);
        return parsed.v === CRYPTO_VERSION &&
               typeof parsed.iv === 'string' &&
               typeof parsed.ct === 'string';
    } catch (e) {
        return false;
    }
};

/**
 * Encrypts a string using AES-GCM
 * @param {string} plaintext - The string to encrypt
 * @param {string} salt - Salt for key derivation
 * @param {string} password - Password/key for encryption
 * @return {Promise<string>} JSON string containing encrypted data and metadata
 */
webCryptoService.encrypt = async function(plaintext, salt, password) {
    if (!webCryptoService.isAvailable()) {
        throw new Error('Web Crypto API is not available');
    }

    const cryptoObj = getCrypto();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = cryptoObj.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from password and salt
    const key = await deriveKey(password, salt);

    // Encrypt the data
    const encryptedData = await cryptoObj.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        data
    );

    // Return versioned format
    return JSON.stringify({
        v: CRYPTO_VERSION,
        iv: arrayBufferToBase64(iv),
        ct: arrayBufferToBase64(encryptedData)
    });
};

/**
 * Decrypts a string that was encrypted with WebCrypto
 * @param {string} encryptedString - JSON string containing encrypted data
 * @param {string} salt - Salt used during encryption
 * @param {string} password - Password/key for decryption
 * @return {Promise<string>} The decrypted plaintext
 */
webCryptoService.decrypt = async function(encryptedString, salt, password) {
    if (!webCryptoService.isAvailable()) {
        throw new Error('Web Crypto API is not available');
    }

    const cryptoObj = getCrypto();
    let data;
    try {
        data = JSON.parse(encryptedString);
    } catch (e) {
        throw new Error('Invalid encrypted data format');
    }

    if (data.v !== CRYPTO_VERSION) {
        throw new Error(`Unsupported encryption version: ${data.v}`);
    }

    // Derive key from password and salt
    const key = await deriveKey(password, salt);

    // Decrypt the data
    const decryptedData = await cryptoObj.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64ToArrayBuffer(data.iv)
        },
        key,
        base64ToArrayBuffer(data.ct)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
};

/**
 * Creates a SHA-256 hash of a string using Web Crypto API
 * @param {string} str - The string to hash
 * @return {Promise<string>} Hex-encoded hash
 */
webCryptoService.sha256 = async function(str) {
    if (!webCryptoService.isAvailable()) {
        throw new Error('Web Crypto API is not available');
    }

    const cryptoObj = getCrypto();
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export { webCryptoService };
