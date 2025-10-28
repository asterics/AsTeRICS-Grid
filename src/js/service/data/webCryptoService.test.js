import { webCryptoService } from './webCryptoService';

// Setup crypto before importing anything else
if (typeof global.crypto === 'undefined' || typeof global.crypto.subtle === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = nodeCrypto.webcrypto;
}

describe('webCryptoService', () => {
    const TEST_PASSWORD = 'testPassword123';
    const TEST_SALT = 'testSalt';
    const TEST_DATA = 'Hello, World!';

    describe('isAvailable', () => {
        test('should return true when Web Crypto API is available', () => {
            expect(webCryptoService.isAvailable()).toBe(true);
        });
    });

    describe('encrypt and decrypt', () => {
        test('should encrypt and decrypt a simple string', async () => {
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe('string');

            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(TEST_DATA);
        });

        test('should encrypt and decrypt empty string', async () => {
            const encrypted = await webCryptoService.encrypt(
                '',
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe('');
        });

        test('should encrypt and decrypt long string', async () => {
            const longString = 'a'.repeat(10000);
            const encrypted = await webCryptoService.encrypt(
                longString,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(longString);
        });

        test('should encrypt and decrypt JSON data', async () => {
            const jsonData = JSON.stringify({
                id: '123',
                name: 'Test Grid',
                data: { complex: 'structure', array: [1, 2, 3] }
            });
            const encrypted = await webCryptoService.encrypt(
                jsonData,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(jsonData);
            expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
        });

        test('should encrypt and decrypt unicode characters', async () => {
            const unicodeData = 'Hello 世界 🌍 Привет مرحبا';
            const encrypted = await webCryptoService.encrypt(
                unicodeData,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(unicodeData);
        });

        test('should produce different ciphertext for same plaintext', async () => {
            // Due to random IV, same plaintext should produce different ciphertext
            const encrypted1 = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            const encrypted2 = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(encrypted1).not.toBe(encrypted2);

            // But both should decrypt to the same value
            const decrypted1 = await webCryptoService.decrypt(
                encrypted1,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted2 = await webCryptoService.decrypt(
                encrypted2,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted1).toBe(TEST_DATA);
            expect(decrypted2).toBe(TEST_DATA);
        });

        test('should fail to decrypt with wrong password', async () => {
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            await expect(
                webCryptoService.decrypt(
                    encrypted,
                    TEST_SALT,
                    'wrongPassword'
                )
            ).rejects.toThrow();
        });

        test('should fail to decrypt with wrong salt', async () => {
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            await expect(
                webCryptoService.decrypt(
                    encrypted,
                    'wrongSalt',
                    TEST_PASSWORD
                )
            ).rejects.toThrow();
        });

        test('should fail to decrypt corrupted data', async () => {
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            const corrupted = encrypted.replace(/a/g, 'b');
            await expect(
                webCryptoService.decrypt(
                    corrupted,
                    TEST_SALT,
                    TEST_PASSWORD
                )
            ).rejects.toThrow();
        });

        test('should fail to decrypt invalid JSON', async () => {
            await expect(
                webCryptoService.decrypt(
                    'not valid json',
                    TEST_SALT,
                    TEST_PASSWORD
                )
            ).rejects.toThrow('Invalid encrypted data format');
        });

        test('should work with different salts', async () => {
            const salt1 = 'salt1';
            const salt2 = 'salt2';

            const encrypted1 = await webCryptoService.encrypt(
                TEST_DATA,
                salt1,
                TEST_PASSWORD
            );
            const encrypted2 = await webCryptoService.encrypt(
                TEST_DATA,
                salt2,
                TEST_PASSWORD
            );

            // Different salts should produce different encryption
            expect(encrypted1).not.toBe(encrypted2);

            // Each should decrypt with its corresponding salt
            const decrypted1 = await webCryptoService.decrypt(
                encrypted1,
                salt1,
                TEST_PASSWORD
            );
            const decrypted2 = await webCryptoService.decrypt(
                encrypted2,
                salt2,
                TEST_PASSWORD
            );

            expect(decrypted1).toBe(TEST_DATA);
            expect(decrypted2).toBe(TEST_DATA);
        });
    });

    describe('isWebCryptoFormat', () => {
        test('should identify WebCrypto format correctly', async () => {
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(webCryptoService.isWebCryptoFormat(encrypted)).toBe(true);
        });

        test('should reject non-WebCrypto format', () => {
            expect(webCryptoService.isWebCryptoFormat('plain text')).toBe(false);
            expect(webCryptoService.isWebCryptoFormat('{"some":"json"}')).toBe(false);
            expect(webCryptoService.isWebCryptoFormat('')).toBe(false);
            expect(webCryptoService.isWebCryptoFormat(null)).toBe(false);
            expect(webCryptoService.isWebCryptoFormat(undefined)).toBe(false);
        });

        test('should reject SJCL format', () => {
            // SJCL format example
            const sjclFormat = JSON.stringify({
                iv: 'someiv',
                v: 1,
                iter: 1000,
                ks: 128,
                ts: 64,
                mode: 'ccm',
                adata: '',
                cipher: 'aes',
                salt: 'somesalt',
                ct: 'ciphertext'
            });
            expect(webCryptoService.isWebCryptoFormat(sjclFormat)).toBe(false);
        });

        test('should validate format structure', () => {
            // Missing required fields
            expect(webCryptoService.isWebCryptoFormat('{"v":2}')).toBe(false);
            expect(webCryptoService.isWebCryptoFormat('{"v":2,"iv":"test"}')).toBe(false);
            expect(webCryptoService.isWebCryptoFormat('{"v":2,"ct":"test"}')).toBe(false);

            // Wrong version
            expect(webCryptoService.isWebCryptoFormat('{"v":1,"iv":"test","ct":"test"}')).toBe(false);

            // Valid format
            expect(webCryptoService.isWebCryptoFormat('{"v":2,"iv":"test","ct":"test"}')).toBe(true);
        });
    });

    describe('sha256', () => {
        test('should create consistent hash', async () => {
            const hash1 = await webCryptoService.sha256(TEST_DATA);
            const hash2 = await webCryptoService.sha256(TEST_DATA);
            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('string');
            expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
        });

        test('should create different hashes for different inputs', async () => {
            const hash1 = await webCryptoService.sha256('input1');
            const hash2 = await webCryptoService.sha256('input2');
            expect(hash1).not.toBe(hash2);
        });

        test('should hash empty string', async () => {
            const hash = await webCryptoService.sha256('');
            expect(hash).toBeTruthy();
            expect(hash.length).toBe(64);
            // Known SHA-256 hash of empty string
            expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
        });

        test('should hash long string', async () => {
            const longString = 'a'.repeat(10000);
            const hash = await webCryptoService.sha256(longString);
            expect(hash).toBeTruthy();
            expect(hash.length).toBe(64);
        });

        test('should hash unicode characters', async () => {
            const unicodeData = 'Hello 世界 🌍';
            const hash = await webCryptoService.sha256(unicodeData);
            expect(hash).toBeTruthy();
            expect(hash.length).toBe(64);
        });
    });

    describe('performance', () => {
        test('should encrypt/decrypt within reasonable time', async () => {
            const data = JSON.stringify({ id: '123', data: 'x'.repeat(1000) });

            const startEncrypt = Date.now();
            const encrypted = await webCryptoService.encrypt(
                data,
                TEST_SALT,
                TEST_PASSWORD
            );
            const encryptTime = Date.now() - startEncrypt;

            const startDecrypt = Date.now();
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decryptTime = Date.now() - startDecrypt;

            expect(decrypted).toBe(data);
            // Should complete in less than 1 second for 1KB data
            expect(encryptTime).toBeLessThan(1000);
            expect(decryptTime).toBeLessThan(1000);
        }, 10000);

        test('should handle large data efficiently', async () => {
            // Test with ~100KB of data
            const largeData = JSON.stringify({
                items: Array(1000).fill({ id: 'x'.repeat(100) })
            });

            const start = Date.now();
            const encrypted = await webCryptoService.encrypt(
                largeData,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            const totalTime = Date.now() - start;

            expect(decrypted).toBe(largeData);
            // Should complete in less than 2 seconds for ~100KB
            expect(totalTime).toBeLessThan(2000);
        }, 10000);
    });

    describe('edge cases', () => {
        test('should handle special characters in password', async () => {
            const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                specialPassword
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                specialPassword
            );
            expect(decrypted).toBe(TEST_DATA);
        });

        test('should handle special characters in salt', async () => {
            const specialSalt = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                specialSalt,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                specialSalt,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(TEST_DATA);
        });

        test('should handle very long password', async () => {
            const longPassword = 'p'.repeat(1000);
            const encrypted = await webCryptoService.encrypt(
                TEST_DATA,
                TEST_SALT,
                longPassword
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                longPassword
            );
            expect(decrypted).toBe(TEST_DATA);
        });

        test('should handle data with newlines and special formatting', async () => {
            const complexData = `Line 1
            Line 2\tTabbed
            Line 3\r\nWindows newline
            Line 4 with "quotes" and 'apostrophes'`;
            const encrypted = await webCryptoService.encrypt(
                complexData,
                TEST_SALT,
                TEST_PASSWORD
            );
            const decrypted = await webCryptoService.decrypt(
                encrypted,
                TEST_SALT,
                TEST_PASSWORD
            );
            expect(decrypted).toBe(complexData);
        });
    });
});
