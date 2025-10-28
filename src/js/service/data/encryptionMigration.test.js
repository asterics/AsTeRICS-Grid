/**
 * Integration tests for SJCL to WebCrypto migration
 * Tests backward compatibility and migration paths
 */

// Setup crypto before importing anything else
if (typeof global.crypto === 'undefined' || typeof global.crypto.subtle === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = nodeCrypto.webcrypto;
}

import { encryptionService } from './encryptionService';
import { webCryptoService } from './webCryptoService';
import { EncryptedObject } from '../../model/EncryptedObject';

jest.mock('../../model/EncryptedObject');
jest.mock('./localStorageService');
jest.mock('../../util/log');

describe('Encryption Migration Tests', () => {
    const TEST_PASSWORD = 'testPassword123';
    const TEST_SALT = 'testSalt';
    const TEST_DATA = { id: '123', name: 'Test Grid', data: 'Some important data' };

    beforeEach(() => {
        encryptionService.resetEncryptionProperties();
        // Reset to default (WebCrypto enabled)
        encryptionService.setUseWebCrypto(true);
    });

    describe('WebCrypto encryption and decryption', () => {
        test('should encrypt and decrypt with WebCrypto by default', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const encrypted = await encryptionService.encryptString(
                JSON.stringify(TEST_DATA),
                TEST_SALT
            );

            // Verify it's WebCrypto format
            expect(webCryptoService.isWebCryptoFormat(encrypted)).toBe(true);

            const decrypted = await encryptionService.decryptString(encrypted, TEST_SALT);
            expect(JSON.parse(decrypted)).toEqual(TEST_DATA);
        });

        test('should encrypt objects with WebCrypto', async () => {
            const testObject = {
                id: 'obj1',
                modelName: 'TestModel',
                data: 'test data'
            };

            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);
            const encryptedObject = await encryptionService.encryptObject(testObject);

            expect(encryptedObject instanceof EncryptedObject).toBeTruthy();
            expect(webCryptoService.isWebCryptoFormat(encryptedObject.encryptedDataBase64)).toBe(true);

            const decrypted = await encryptionService.decryptObjects(encryptedObject);
            expect(decrypted.data).toBe(testObject.data);
        });
    });

    describe('SJCL backward compatibility', () => {
        test('should decrypt SJCL-encrypted data', async () => {
            // First encrypt with SJCL (disable WebCrypto)
            encryptionService.setUseWebCrypto(false);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const sjclEncrypted = await encryptionService.encryptString(
                JSON.stringify(TEST_DATA),
                TEST_SALT
            );

            // Verify it's NOT WebCrypto format
            expect(webCryptoService.isWebCryptoFormat(sjclEncrypted)).toBe(false);

            // Now enable WebCrypto and try to decrypt SJCL data
            encryptionService.setUseWebCrypto(true);
            const decrypted = await encryptionService.decryptString(sjclEncrypted, TEST_SALT);

            expect(JSON.parse(decrypted)).toEqual(TEST_DATA);
        });

        test('should decrypt SJCL-encrypted objects', async () => {
            const testObject = {
                id: 'obj2',
                modelName: 'TestModel',
                data: 'legacy data'
            };

            // Encrypt with SJCL
            encryptionService.setUseWebCrypto(false);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);
            const sjclEncryptedObject = await encryptionService.encryptObject(testObject);

            // Decrypt with WebCrypto enabled (should still work)
            encryptionService.setUseWebCrypto(true);
            const decrypted = await encryptionService.decryptObjects(sjclEncryptedObject);

            expect(decrypted.data).toBe(testObject.data);
        });
    });

    describe('Format detection and switching', () => {
        test('should correctly identify WebCrypto vs SJCL format', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            // Encrypt with WebCrypto
            encryptionService.setUseWebCrypto(true);
            const webCryptoEncrypted = await encryptionService.encryptString('test1', TEST_SALT);
            expect(webCryptoService.isWebCryptoFormat(webCryptoEncrypted)).toBe(true);

            // Encrypt with SJCL
            encryptionService.setUseWebCrypto(false);
            const sjclEncrypted = await encryptionService.encryptString('test2', TEST_SALT);
            expect(webCryptoService.isWebCryptoFormat(sjclEncrypted)).toBe(false);
        });

        test('should decrypt mixed formats in same session', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            // Create SJCL encrypted data
            encryptionService.setUseWebCrypto(false);
            const sjclData = await encryptionService.encryptString('SJCL data', TEST_SALT);

            // Create WebCrypto encrypted data
            encryptionService.setUseWebCrypto(true);
            const webCryptoData = await encryptionService.encryptString('WebCrypto data', TEST_SALT);

            // Decrypt both (format should be auto-detected)
            const decryptedSjcl = await encryptionService.decryptString(sjclData, TEST_SALT);
            const decryptedWebCrypto = await encryptionService.decryptString(webCryptoData, TEST_SALT);

            expect(decryptedSjcl).toBe('SJCL data');
            expect(decryptedWebCrypto).toBe('WebCrypto data');
        });

        test('should handle array of mixed format encrypted objects', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const obj1 = { id: 'obj1', modelName: 'Test', data: 'data1' };
            const obj2 = { id: 'obj2', modelName: 'Test', data: 'data2' };

            // Encrypt obj1 with SJCL
            encryptionService.setUseWebCrypto(false);
            const encrypted1 = await encryptionService.encryptObject(obj1);

            // Encrypt obj2 with WebCrypto
            encryptionService.setUseWebCrypto(true);
            const encrypted2 = await encryptionService.encryptObject(obj2);

            // Decrypt both at once
            const decrypted = await encryptionService.decryptObjects([encrypted1, encrypted2]);

            expect(decrypted).toHaveLength(2);
            expect(decrypted[0].data).toBe('data1');
            expect(decrypted[1].data).toBe('data2');
        });
    });

    describe('Migration scenarios', () => {
        test('should handle gradual migration from SJCL to WebCrypto', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            // Simulate legacy data (encrypted with SJCL)
            encryptionService.setUseWebCrypto(false);
            const legacyEncrypted = await encryptionService.encryptString('legacy data', TEST_SALT);

            // Enable WebCrypto (like after upgrade)
            encryptionService.setUseWebCrypto(true);

            // Should be able to decrypt legacy data
            const decrypted = await encryptionService.decryptString(legacyEncrypted, TEST_SALT);
            expect(decrypted).toBe('legacy data');

            // New encryptions should use WebCrypto
            const newEncrypted = await encryptionService.encryptString('new data', TEST_SALT);
            expect(webCryptoService.isWebCryptoFormat(newEncrypted)).toBe(true);

            // And should decrypt correctly
            const newDecrypted = await encryptionService.decryptString(newEncrypted, TEST_SALT);
            expect(newDecrypted).toBe('new data');
        });

        test('should support re-encryption from SJCL to WebCrypto', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const originalData = { id: '456', important: 'data' };

            // Original encryption with SJCL
            encryptionService.setUseWebCrypto(false);
            const sjclEncrypted = await encryptionService.encryptString(
                JSON.stringify(originalData),
                TEST_SALT
            );

            // Decrypt
            const decrypted = await encryptionService.decryptString(sjclEncrypted, TEST_SALT);

            // Re-encrypt with WebCrypto
            encryptionService.setUseWebCrypto(true);
            const webCryptoEncrypted = await encryptionService.encryptString(decrypted, TEST_SALT);

            // Verify it's now in WebCrypto format
            expect(webCryptoService.isWebCryptoFormat(webCryptoEncrypted)).toBe(true);

            // And can be decrypted correctly
            const reDecrypted = await encryptionService.decryptString(webCryptoEncrypted, TEST_SALT);
            expect(JSON.parse(reDecrypted)).toEqual(originalData);
        });
    });

    describe('Error handling', () => {
        test('should fail gracefully with wrong password for WebCrypto', async () => {
            encryptionService.setUseWebCrypto(true);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const encrypted = await encryptionService.encryptString('secret', TEST_SALT);

            // Try to decrypt with wrong password
            encryptionService.setEncryptionProperties('wrongPassword', TEST_SALT);
            await expect(
                encryptionService.decryptString(encrypted, TEST_SALT)
            ).rejects.toThrow();
        });

        test('should fail gracefully with wrong password for SJCL', async () => {
            encryptionService.setUseWebCrypto(false);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const encrypted = await encryptionService.encryptString('secret', TEST_SALT);

            // Try to decrypt with wrong password
            encryptionService.setEncryptionProperties('wrongPassword', TEST_SALT);
            await expect(
                encryptionService.decryptString(encrypted, TEST_SALT)
            ).rejects.toThrow();
        });

        test('should handle corrupted WebCrypto data', async () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const corrupted = '{"v":2,"iv":"invalid","ct":"corrupted"}';
            await expect(
                encryptionService.decryptString(corrupted, TEST_SALT)
            ).rejects.toThrow();
        });
    });

    describe('Configuration and state management', () => {
        test('should report WebCrypto usage correctly', () => {
            encryptionService.setUseWebCrypto(true);
            expect(encryptionService.isUsingWebCrypto()).toBe(true);

            encryptionService.setUseWebCrypto(false);
            expect(encryptionService.isUsingWebCrypto()).toBe(false);
        });

        test('should persist WebCrypto setting across operations', async () => {
            encryptionService.setUseWebCrypto(true);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const enc1 = await encryptionService.encryptString('test1', TEST_SALT);
            expect(webCryptoService.isWebCryptoFormat(enc1)).toBe(true);

            const enc2 = await encryptionService.encryptString('test2', TEST_SALT);
            expect(webCryptoService.isWebCryptoFormat(enc2)).toBe(true);
        });

        test('should reset properties correctly', () => {
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);
            encryptionService.resetEncryptionProperties();

            expect(() => {
                encryptionService.getStringHash('test');
            }).toThrow();
        });
    });

    describe('Cache behavior', () => {
        test('should cache WebCrypto decryptions', async () => {
            encryptionService.setUseWebCrypto(true);
            encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);

            const encrypted = await encryptionService.encryptString('cached data', TEST_SALT);

            // First decryption
            const start1 = Date.now();
            const decrypted1 = await encryptionService.decryptString(encrypted, TEST_SALT);
            const time1 = Date.now() - start1;

            // Second decryption (should be cached)
            const start2 = Date.now();
            const decrypted2 = await encryptionService.decryptString(encrypted, TEST_SALT);
            const time2 = Date.now() - start2;

            expect(decrypted1).toBe('cached data');
            expect(decrypted2).toBe('cached data');
            // Cached version should be faster (though not guaranteed in all environments)
            expect(time2).toBeLessThanOrEqual(time1);
        });
    });
});
