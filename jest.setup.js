// Jest setup file - runs before all tests
// Setup WebCrypto API for Node.js environment

const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

// Set up crypto on all possible globals for maximum compatibility
// Always override to ensure we have the webcrypto implementation
global.crypto = webcrypto;
globalThis.crypto = webcrypto;

// Set up TextEncoder and TextDecoder (needed for WebCrypto)
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}

// For jsdom environment, we need to add subtle to the existing Crypto object
// because jsdom provides a Crypto object without subtle
if (typeof window !== 'undefined') {
    // Add TextEncoder/TextDecoder to window as well
    if (typeof window.TextEncoder === 'undefined') {
        window.TextEncoder = TextEncoder;
    }
    if (typeof window.TextDecoder === 'undefined') {
        window.TextDecoder = TextDecoder;
    }

    // If jsdom has provided a Crypto object without subtle, add it
    if (window.crypto && !window.crypto.subtle) {
        Object.defineProperty(window.crypto, 'subtle', {
            value: webcrypto.subtle,
            writable: false,
            configurable: true
        });

        // Also add other webcrypto methods
        Object.defineProperty(window.crypto, 'getRandomValues', {
            value: webcrypto.getRandomValues.bind(webcrypto),
            writable: false,
            configurable: true
        });
    } else {
        // Otherwise, replace it entirely with webcrypto
        window.crypto = webcrypto;
    }
}
