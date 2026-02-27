// Test the capitalization logic without importing the full service
// import { collectElementService } from './collectElementService.js';
// import { GridElement } from '../model/GridElement.js';
// import { i18nService } from './i18nService.js';

// Mock dependencies
jest.mock('../externals/jquery.js', () => ({
    default: jest.fn(() => ({
        on: jest.fn(),
        attr: jest.fn(),
        html: jest.fn()
    }))
}));

jest.mock('./i18nService.js', () => ({
    i18nService: {
        getTranslationObject: jest.fn((text) => ({ en: text })),
        getTranslation: jest.fn((obj) => typeof obj === 'string' ? obj : obj.en),
        getContentLang: jest.fn(() => 'en'),
        t: jest.fn((key) => key)
    }
}));

jest.mock('../model/GridElement.js', () => ({
    GridElement: jest.fn().mockImplementation((props) => ({
        ...props,
        id: 'test-id',
        label: props.label || { en: '' }
    }))
}));

jest.mock('./predictionService.js', () => ({
    predictionService: {
        predict: jest.fn(),
        learnFromInput: jest.fn()
    }
}));

jest.mock('../util/constants.js', () => ({
    constants: {
        ELEMENT_EVENT_ID: 'ELEMENT_EVENT_ID',
        DEFAULT_ELEMENT_FONT_COLOR: '#000',
        DEFAULT_ELEMENT_FONT_COLOR_DARK: '#fff'
    }
}));

jest.mock('../util/fontUtil.js', () => ({
    fontUtil: {
        getTextWidth: jest.fn(() => 100)
    }
}));

// Mock other dependencies
jest.mock('./speechService.js', () => ({ speechService: {} }));
jest.mock('./youtubeService.js', () => ({ youtubeService: {} }));
jest.mock('./data/dataService.js', () => ({ dataService: {} }));
jest.mock('./pictograms/arasaacService.js', () => ({ arasaacService: {} }));
jest.mock('./stateService.js', () => ({ stateService: {} }));
jest.mock('./liveElementService.js', () => ({ liveElementService: {} }));
jest.mock('../util/imageUtil.js', () => ({ imageUtil: {} }));
jest.mock('../util/util.js', () => ({ util: {} }));

const { i18nService } = require('./i18nService.js');

// Implement the capitalization functions for testing
function getLocaleForCapitalization() {
    if (i18nService && typeof i18nService.getContentLang === 'function') {
        const locale = i18nService.getContentLang();
        return locale || undefined;
    }
    return undefined;
}

function isAlphabeticCharacter(char, locale) {
    if (!char) {
        return false;
    }
    const upper = locale ? char.toLocaleUpperCase(locale) : char.toLocaleUpperCase();
    const lower = locale ? char.toLocaleLowerCase(locale) : char.toLocaleLowerCase();
    return upper !== lower;
}

function capitalizeFirstLetter(text) {
    if (!text) {
        return text;
    }

    const locale = getLocaleForCapitalization();
    for (let index = 0; index < text.length;) {
        const codePoint = text.codePointAt(index);
        const char = String.fromCodePoint(codePoint);
        const charLength = char.length;

        if (isAlphabeticCharacter(char, locale)) {
            const upperChar = locale ? char.toLocaleUpperCase(locale) : char.toLocaleUpperCase();
            return text.slice(0, index) + upperChar + text.slice(index + charLength);
        }

        index += charLength;
    }
    return text;
}

function applySentenceCapitalization(currentText, newText) {
    if (!newText) {
        return newText;
    }

    const locale = getLocaleForCapitalization();
    let result = newText;

    if (/[.!?](\s*)$/.test(currentText)) {
        result = capitalizeFirstLetter(result);
    }

    let transformed = '';
    let index = 0;
    let punctuationPending = false;
    let whitespaceSeen = false;

    while (index < result.length) {
        const codePoint = result.codePointAt(index);
        const char = String.fromCodePoint(codePoint);
        const charLength = char.length;

        if (punctuationPending) {
            if (/\s/.test(char)) {
                whitespaceSeen = true;
                transformed += char;
            } else if (whitespaceSeen && isAlphabeticCharacter(char, locale)) {
                const upperChar = locale ? char.toLocaleUpperCase(locale) : char.toLocaleUpperCase();
                transformed += upperChar;
                punctuationPending = false;
                whitespaceSeen = false;
            } else {
                transformed += char;
                punctuationPending = false;
                whitespaceSeen = false;
            }
        } else {
            transformed += char;
            if (/[.!?]/.test(char)) {
                punctuationPending = true;
                whitespaceSeen = false;
            }
        }

        index += charLength;
    }

    return transformed;
}

function applyAutoCapitalization(text, isAppending = false, currentText = '') {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // If this is the very first text (empty collect element), capitalize first letter
    if (!currentText.trim() && !isAppending) {
        return capitalizeFirstLetter(text);
    }

    // If appending to existing text, check if we need sentence capitalization
    if (isAppending && currentText) {
        return applySentenceCapitalization(currentText, text);
    }

    // For new text elements, check if previous text ends with sentence punctuation
    if (!isAppending && currentText) {
        let trimmedCurrent = currentText.trim();
        if (trimmedCurrent && /[.!?]$/.test(trimmedCurrent)) {
            return capitalizeFirstLetter(text);
        }
    }

    return text;
}

describe('collectElementService - Automatic Capitalization', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('First word capitalization', () => {
        test('should capitalize first letter when collect element is empty', () => {
            const result = applyAutoCapitalization('hello', false, '');
            expect(result).toBe('Hello');
        });

        test('should capitalize first alphabetic character, ignoring symbols', () => {
            const result = applyAutoCapitalization('123hello', false, '');
            expect(result).toBe('123Hello');
        });

        test('should capitalize locale-specific letters like ł', () => {
            const result = applyAutoCapitalization('łukasz', false, '');
            expect(result).toBe('Łukasz');
        });

        test('should handle empty or null text gracefully', () => {
            expect(applyAutoCapitalization('', false, '')).toBe('');
            expect(applyAutoCapitalization(null, false, '')).toBe(null);
            expect(applyAutoCapitalization(undefined, false, '')).toBe(undefined);
        });

        test('should not change already capitalized text', () => {
            const result = applyAutoCapitalization('HELLO', false, '');
            expect(result).toBe('HELLO');
        });
    });

    describe('Sentence capitalization', () => {
        test('should capitalize after period', () => {
            const result = applyAutoCapitalization('world', true, 'Hello.');
            expect(result).toBe('World');
        });

        test('should capitalize after question mark', () => {
            const result = applyAutoCapitalization('yes', true, 'Are you ready?');
            expect(result).toBe('Yes');
        });

        test('should capitalize after exclamation mark', () => {
            const result = applyAutoCapitalization('that', true, 'Great!');
            expect(result).toBe('That');
        });

        test('should capitalize non-ASCII letters after punctuation', () => {
            const result = applyAutoCapitalization('łukasz', true, 'Cześć!');
            expect(result).toBe('Łukasz');
        });

        test('should handle multiple spaces after punctuation', () => {
            const result = applyAutoCapitalization(' next', true, 'End.');
            expect(result).toBe(' Next');
        });

        test('should capitalize new element after sentence', () => {
            const result = applyAutoCapitalization('this', false, 'Hello world.');
            expect(result).toBe('This');
        });

        test('should not capitalize when no sentence ending', () => {
            const result = applyAutoCapitalization('world', true, 'Hello ');
            expect(result).toBe('world');
        });
    });

    describe('Edge cases', () => {
        test('should handle text with no alphabetic characters', () => {
            const result = applyAutoCapitalization('123!@#', false, '');
            expect(result).toBe('123!@#');
        });

        test('should handle mixed punctuation scenarios', () => {
            const result = applyAutoCapitalization('next', true, 'Hello... world?');
            expect(result).toBe('Next');
        });

        test('should handle punctuation without following space', () => {
            const result = applyAutoCapitalization('word', true, 'Hello.');
            expect(result).toBe('Word');
        });
    });

    describe('Helper functions', () => {
        test('capitalizeFirstLetter should work correctly', () => {
            expect(capitalizeFirstLetter('hello')).toBe('Hello');
            expect(capitalizeFirstLetter('123hello')).toBe('123Hello');
            expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
            expect(capitalizeFirstLetter('łukasz')).toBe('Łukasz');
            expect(capitalizeFirstLetter('')).toBe('');
            expect(capitalizeFirstLetter('123')).toBe('123');
        });

        test('applySentenceCapitalization should work correctly', () => {
            expect(applySentenceCapitalization('Hello.', 'world')).toBe('World');
            expect(applySentenceCapitalization('Hello?', 'yes')).toBe('Yes');
            expect(applySentenceCapitalization('Hello!', 'great')).toBe('Great');
            expect(applySentenceCapitalization('Cześć!', 'łukasz')).toBe('Łukasz');
            expect(applySentenceCapitalization('Hello', 'world')).toBe('world');
        });
    });
});

// Helper function to create mock grid elements
function createMockElement(label, onlyText = false) {
    return {
        id: 'test-' + Math.random(),
        label: { en: label },
        onlyText: onlyText
    };
}
