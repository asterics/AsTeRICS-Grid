import { codeReaderMatcher } from './codeReaderMatcher';

let ELEMENTS = [
    { id: 'grid-element-aaa', label: { de: 'Hallo', en: 'Hello' } },
    { id: 'grid-element-bbb', label: { de: 'Tschüss', en: 'Bye' } },
    { id: 'grid-element-ccc', label: 'PlainLabel' },
    { id: 'grid-element-ddd' } // no label
];

describe('codeReaderMatcher.normalize', () => {
    test('returns empty string for null/undefined', () => {
        expect(codeReaderMatcher.normalize(null)).toBe('');
        expect(codeReaderMatcher.normalize(undefined)).toBe('');
    });

    test('trims, collapses whitespace and lowercases', () => {
        expect(codeReaderMatcher.normalize('  Hello   World  ')).toBe('hello world');
    });

    test('handles non-string input', () => {
        expect(codeReaderMatcher.normalize(123)).toBe('123');
    });
});

describe('codeReaderMatcher.getLabelStrings', () => {
    test('returns values of a locale map', () => {
        expect(codeReaderMatcher.getLabelStrings(ELEMENTS[0]).sort()).toEqual(['Hallo', 'Hello']);
    });

    test('wraps a plain string label', () => {
        expect(codeReaderMatcher.getLabelStrings(ELEMENTS[2])).toEqual(['PlainLabel']);
    });

    test('returns empty array when label missing', () => {
        expect(codeReaderMatcher.getLabelStrings(ELEMENTS[3])).toEqual([]);
        expect(codeReaderMatcher.getLabelStrings(null)).toEqual([]);
    });
});

describe('codeReaderMatcher.findMatchingElement', () => {
    test('matches by technical id', () => {
        let match = codeReaderMatcher.findMatchingElement('grid-element-bbb', ELEMENTS);
        expect(match).toBe(ELEMENTS[1]);
    });

    test('matches by label in any language', () => {
        expect(codeReaderMatcher.findMatchingElement('Hello', ELEMENTS)).toBe(ELEMENTS[0]);
        expect(codeReaderMatcher.findMatchingElement('Tschüss', ELEMENTS)).toBe(ELEMENTS[1]);
    });

    test('is tolerant to case and surrounding whitespace', () => {
        expect(codeReaderMatcher.findMatchingElement('  hELLo  ', ELEMENTS)).toBe(ELEMENTS[0]);
    });

    test('returns null when nothing matches', () => {
        expect(codeReaderMatcher.findMatchingElement('does-not-exist', ELEMENTS)).toBe(null);
    });

    test('returns null for empty decoded text or invalid element list', () => {
        expect(codeReaderMatcher.findMatchingElement('', ELEMENTS)).toBe(null);
        expect(codeReaderMatcher.findMatchingElement('Hello', null)).toBe(null);
    });

    test('matchMode "id" ignores label matches', () => {
        let options = { matchMode: codeReaderMatcher.MATCH_ID };
        expect(codeReaderMatcher.findMatchingElement('Hello', ELEMENTS, options)).toBe(null);
        expect(codeReaderMatcher.findMatchingElement('grid-element-aaa', ELEMENTS, options)).toBe(ELEMENTS[0]);
    });

    test('matchMode "label" ignores id matches', () => {
        let options = { matchMode: codeReaderMatcher.MATCH_LABEL };
        expect(codeReaderMatcher.findMatchingElement('grid-element-aaa', ELEMENTS, options)).toBe(null);
        expect(codeReaderMatcher.findMatchingElement('Hello', ELEMENTS, options)).toBe(ELEMENTS[0]);
    });

    test('returns the first matching element on duplicate labels', () => {
        let elements = [
            { id: 'a', label: { en: 'Yes' } },
            { id: 'b', label: { en: 'Yes' } }
        ];
        expect(codeReaderMatcher.findMatchingElement('Yes', elements)).toBe(elements[0]);
    });
});
