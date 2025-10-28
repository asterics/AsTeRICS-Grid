/**
 * Performance benchmark tests for SJCL vs WebCrypto
 * These tests measure and compare performance characteristics
 */

// Setup crypto before importing anything else
if (typeof global.crypto === 'undefined' || typeof global.crypto.subtle === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = nodeCrypto.webcrypto;
}

import { encryptionService } from './encryptionService';
import { webCryptoService } from './webCryptoService';

jest.mock('./localStorageService');
jest.mock('../../util/log');
jest.mock('../../model/EncryptedObject');
jest.mock('../../externals/sjcl');

describe('Encryption Performance Benchmarks', () => {
    const TEST_PASSWORD = 'benchmarkPassword';
    const TEST_SALT = 'benchmarkSalt';

    beforeEach(() => {
        encryptionService.resetEncryptionProperties();
        encryptionService.setEncryptionProperties(TEST_PASSWORD, TEST_SALT);
    });

    // Helper to generate test data of specific size
    function generateData(sizeInChars) {
        return 'x'.repeat(sizeInChars);
    }

    // Helper to create a grid-like object
    function createGridObject(dataSize) {
        return {
            id: 'grid_' + Math.random(),
            modelName: 'GridData',
            gridElements: Array(10).fill({
                id: 'elem_' + Math.random(),
                label: generateData(dataSize / 10)
            })
        };
    }

    describe('Small data performance (< 1KB)', () => {
        const SMALL_DATA = generateData(500); // ~500 bytes

        test('WebCrypto encryption performance for small data', async () => {
            encryptionService.setUseWebCrypto(true);

            const iterations = 50;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(SMALL_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`WebCrypto small data encryption: ${avgTime.toFixed(2)}ms avg (${iterations} iterations)`);
            expect(avgTime).toBeLessThan(100); // Should be under 100ms per operation
        }, 15000);

        test('SJCL encryption performance for small data', async () => {
            encryptionService.setUseWebCrypto(false);

            const iterations = 50;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(SMALL_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`SJCL small data encryption: ${avgTime.toFixed(2)}ms avg (${iterations} iterations)`);
            expect(avgTime).toBeLessThan(100); // Should be under 100ms per operation
        }, 15000);

        test('Compare small data encryption', async () => {
            const iterations = 20;

            // WebCrypto timing
            encryptionService.setUseWebCrypto(true);
            const webCryptoStart = Date.now();
            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(SMALL_DATA, TEST_SALT);
            }
            const webCryptoTime = Date.now() - webCryptoStart;

            // SJCL timing
            encryptionService.setUseWebCrypto(false);
            const sjclStart = Date.now();
            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(SMALL_DATA, TEST_SALT);
            }
            const sjclTime = Date.now() - sjclStart;

            console.log(`Small data comparison (${iterations} iterations):`);
            console.log(`  WebCrypto: ${webCryptoTime}ms`);
            console.log(`  SJCL: ${sjclTime}ms`);
            console.log(`  Ratio: ${(webCryptoTime / sjclTime).toFixed(2)}x`);

            // Both should complete in reasonable time
            expect(webCryptoTime).toBeLessThan(5000);
            expect(sjclTime).toBeLessThan(5000);
        }, 20000);
    });

    describe('Medium data performance (~10KB)', () => {
        const MEDIUM_DATA = generateData(10000); // ~10KB

        test('WebCrypto encryption performance for medium data', async () => {
            encryptionService.setUseWebCrypto(true);

            const iterations = 20;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(MEDIUM_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`WebCrypto medium data encryption: ${avgTime.toFixed(2)}ms avg`);
            expect(avgTime).toBeLessThan(200);
        }, 15000);

        test('SJCL encryption performance for medium data', async () => {
            encryptionService.setUseWebCrypto(false);

            const iterations = 20;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(MEDIUM_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`SJCL medium data encryption: ${avgTime.toFixed(2)}ms avg`);
            expect(avgTime).toBeLessThan(500);
        }, 15000);

        test('Compare medium data encryption and decryption', async () => {
            const iterations = 10;

            // WebCrypto full round-trip
            encryptionService.setUseWebCrypto(true);
            const webCryptoStart = Date.now();
            let webCryptoEncrypted;
            for (let i = 0; i < iterations; i++) {
                webCryptoEncrypted = await encryptionService.encryptString(MEDIUM_DATA, TEST_SALT);
                await encryptionService.decryptString(webCryptoEncrypted, TEST_SALT);
            }
            const webCryptoTime = Date.now() - webCryptoStart;

            // SJCL full round-trip
            encryptionService.setUseWebCrypto(false);
            const sjclStart = Date.now();
            let sjclEncrypted;
            for (let i = 0; i < iterations; i++) {
                sjclEncrypted = await encryptionService.encryptString(MEDIUM_DATA, TEST_SALT);
                await encryptionService.decryptString(sjclEncrypted, TEST_SALT);
            }
            const sjclTime = Date.now() - sjclStart;

            console.log(`Medium data round-trip comparison (${iterations} iterations):`);
            console.log(`  WebCrypto: ${webCryptoTime}ms (${(webCryptoTime / iterations).toFixed(2)}ms avg)`);
            console.log(`  SJCL: ${sjclTime}ms (${(sjclTime / iterations).toFixed(2)}ms avg)`);
            console.log(`  WebCrypto is ${(sjclTime / webCryptoTime).toFixed(2)}x ${sjclTime < webCryptoTime ? 'slower' : 'faster'}`);
        }, 20000);
    });

    describe('Large data performance (~100KB)', () => {
        const LARGE_DATA = generateData(100000); // ~100KB

        test('WebCrypto encryption performance for large data', async () => {
            encryptionService.setUseWebCrypto(true);

            const iterations = 10;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(LARGE_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`WebCrypto large data encryption: ${avgTime.toFixed(2)}ms avg`);
            expect(avgTime).toBeLessThan(500);
        }, 15000);

        test('SJCL encryption performance for large data', async () => {
            encryptionService.setUseWebCrypto(false);

            const iterations = 5; // Fewer iterations for SJCL due to slower performance
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(LARGE_DATA, TEST_SALT);
            }

            const totalTime = Date.now() - start;
            const avgTime = totalTime / iterations;

            console.log(`SJCL large data encryption: ${avgTime.toFixed(2)}ms avg`);
            expect(avgTime).toBeLessThan(2000);
        }, 15000);

        test('Compare large data encryption - WebCrypto advantage', async () => {
            const iterations = 5;

            // WebCrypto timing
            encryptionService.setUseWebCrypto(true);
            const webCryptoStart = Date.now();
            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(LARGE_DATA, TEST_SALT);
            }
            const webCryptoTime = Date.now() - webCryptoStart;

            // SJCL timing
            encryptionService.setUseWebCrypto(false);
            const sjclStart = Date.now();
            for (let i = 0; i < iterations; i++) {
                await encryptionService.encryptString(LARGE_DATA, TEST_SALT);
            }
            const sjclTime = Date.now() - sjclStart;

            const speedup = sjclTime / webCryptoTime;

            console.log(`Large data comparison (${iterations} iterations):`);
            console.log(`  WebCrypto: ${webCryptoTime}ms (${(webCryptoTime / iterations).toFixed(2)}ms avg)`);
            console.log(`  SJCL: ${sjclTime}ms (${(sjclTime / iterations).toFixed(2)}ms avg)`);
            console.log(`  WebCrypto is ${speedup.toFixed(2)}x faster`);

            // WebCrypto should be significantly faster for large data
            // Based on research, expect at least 2x speedup
            expect(speedup).toBeGreaterThan(1.5);
        }, 30000);
    });

    describe('Realistic grid object performance', () => {
        test('Encrypt and decrypt typical grid object', async () => {
            const gridObject = createGridObject(5000);
            const gridJson = JSON.stringify(gridObject);

            // WebCrypto
            encryptionService.setUseWebCrypto(true);
            const webCryptoStart = Date.now();
            const webCryptoEncrypted = await encryptionService.encryptString(gridJson, TEST_SALT);
            const webCryptoEncTime = Date.now() - webCryptoStart;

            const webCryptoDecStart = Date.now();
            await encryptionService.decryptString(webCryptoEncrypted, TEST_SALT);
            const webCryptoDecTime = Date.now() - webCryptoDecStart;

            // SJCL
            encryptionService.setUseWebCrypto(false);
            const sjclStart = Date.now();
            const sjclEncrypted = await encryptionService.encryptString(gridJson, TEST_SALT);
            const sjclEncTime = Date.now() - sjclStart;

            const sjclDecStart = Date.now();
            await encryptionService.decryptString(sjclEncrypted, TEST_SALT);
            const sjclDecTime = Date.now() - sjclDecStart;

            console.log('Grid object performance:');
            console.log(`  Data size: ${gridJson.length} bytes`);
            console.log(`  WebCrypto - Encrypt: ${webCryptoEncTime}ms, Decrypt: ${webCryptoDecTime}ms, Total: ${webCryptoEncTime + webCryptoDecTime}ms`);
            console.log(`  SJCL - Encrypt: ${sjclEncTime}ms, Decrypt: ${sjclDecTime}ms, Total: ${sjclEncTime + sjclDecTime}ms`);
            console.log(`  Speedup: ${((sjclEncTime + sjclDecTime) / (webCryptoEncTime + webCryptoDecTime)).toFixed(2)}x`);

            // Both should complete in reasonable time
            expect(webCryptoEncTime + webCryptoDecTime).toBeLessThan(2000);
        }, 15000);

        test('Batch encryption of multiple grid objects', async () => {
            const gridObjects = Array(10).fill(null).map(() => createGridObject(1000));

            // WebCrypto batch
            encryptionService.setUseWebCrypto(true);
            const webCryptoStart = Date.now();
            for (const obj of gridObjects) {
                await encryptionService.encryptString(JSON.stringify(obj), TEST_SALT);
            }
            const webCryptoTime = Date.now() - webCryptoStart;

            // SJCL batch
            encryptionService.setUseWebCrypto(false);
            const sjclStart = Date.now();
            for (const obj of gridObjects) {
                await encryptionService.encryptString(JSON.stringify(obj), TEST_SALT);
            }
            const sjclTime = Date.now() - sjclStart;

            console.log(`Batch encryption (${gridObjects.length} objects):`);
            console.log(`  WebCrypto: ${webCryptoTime}ms (${(webCryptoTime / gridObjects.length).toFixed(2)}ms avg)`);
            console.log(`  SJCL: ${sjclTime}ms (${(sjclTime / gridObjects.length).toFixed(2)}ms avg)`);

            expect(webCryptoTime).toBeLessThan(10000);
        }, 20000);
    });

    describe('Hash performance', () => {
        test('SHA-256 hash performance', () => {
            const testData = generateData(1000);
            const iterations = 1000;

            const start = Date.now();
            for (let i = 0; i < iterations; i++) {
                encryptionService.getStringHash(testData + i); // Add i to prevent caching
            }
            const totalTime = Date.now() - start;

            console.log(`Hash performance: ${totalTime}ms for ${iterations} iterations (${(totalTime / iterations).toFixed(2)}ms avg)`);
            expect(totalTime).toBeLessThan(5000);
        });
    });

    describe('Memory and data size', () => {
        test('Verify encryption overhead', async () => {
            encryptionService.setUseWebCrypto(true);

            const testData = generateData(10000);
            const encrypted = await encryptionService.encryptString(testData, TEST_SALT);

            const originalSize = testData.length;
            const encryptedSize = encrypted.length;
            const overhead = ((encryptedSize - originalSize) / originalSize * 100).toFixed(2);

            console.log(`Encryption overhead:`);
            console.log(`  Original: ${originalSize} bytes`);
            console.log(`  Encrypted: ${encryptedSize} bytes`);
            console.log(`  Overhead: ${overhead}%`);

            // Overhead should be reasonable (typically 20-50% for encryption + encoding)
            expect(encryptedSize).toBeGreaterThan(originalSize);
            expect(encryptedSize).toBeLessThan(originalSize * 2);
        });
    });
});
