/**
 * Pure helper functions for matching a decoded code (from the handheld code reader)
 * to a grid element by its technical id or its visible label (in any language).
 *
 * Kept free of model/service dependencies so it stays easy to unit test.
 */

let codeReaderMatcher = {};

codeReaderMatcher.MATCH_ID = 'id';
codeReaderMatcher.MATCH_LABEL = 'label';
codeReaderMatcher.MATCH_ID_AND_LABEL = 'idAndLabel';

/**
 * normalizes a string for tolerant comparison: trims, collapses inner whitespace and lowercases.
 * @param text any value (string, number, null, undefined)
 * @return {string} the normalized string ('' for null/undefined)
 */
codeReaderMatcher.normalize = function (text) {
    if (text === null || text === undefined) {
        return '';
    }
    return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
};

/**
 * returns all label strings of an element across all locales.
 * Handles label being a locale->string map, a plain string or undefined.
 * @param element a grid element (or plain object with a "label" property)
 * @return {string[]} list of label strings (possibly empty)
 */
codeReaderMatcher.getLabelStrings = function (element) {
    if (!element) {
        return [];
    }
    let label = element.label;
    if (typeof label === 'string') {
        return [label];
    }
    if (label && typeof label === 'object') {
        return Object.keys(label)
            .map((locale) => label[locale])
            .filter((value) => typeof value === 'string');
    }
    return [];
};

/**
 * finds the first grid element whose technical id or visible label matches the decoded text.
 * Matching is tolerant (see normalize): trimmed, whitespace-collapsed, case-insensitive.
 *
 * Note: if several elements share the same id or label, the first one in array (grid) order wins,
 * so no random element is triggered. For production use encode a stable technical id in the code:
 * it is language-independent and unique. Label matching is only an optional convenience and can be
 * ambiguous when labels are duplicated.
 *
 * @param decodedText the raw text decoded from a code
 * @param gridElements array of grid elements (or plain objects with id/label)
 * @param options.matchMode one of MATCH_ID / MATCH_LABEL / MATCH_ID_AND_LABEL (default: MATCH_ID_AND_LABEL)
 * @return the first matching element, or null if nothing matches
 */
codeReaderMatcher.findMatchingElement = function (decodedText, gridElements, options) {
    options = options || {};
    let matchMode = options.matchMode || codeReaderMatcher.MATCH_ID_AND_LABEL;
    let needle = codeReaderMatcher.normalize(decodedText);
    if (!needle || !Array.isArray(gridElements)) {
        return null;
    }
    let matchId = matchMode === codeReaderMatcher.MATCH_ID || matchMode === codeReaderMatcher.MATCH_ID_AND_LABEL;
    let matchLabel = matchMode === codeReaderMatcher.MATCH_LABEL || matchMode === codeReaderMatcher.MATCH_ID_AND_LABEL;
    for (let element of gridElements) {
        if (!element) {
            continue;
        }
        if (matchId && element.id && codeReaderMatcher.normalize(element.id) === needle) {
            return element;
        }
        if (matchLabel) {
            let labels = codeReaderMatcher.getLabelStrings(element);
            if (labels.some((label) => codeReaderMatcher.normalize(label) === needle)) {
                return element;
            }
        }
    }
    return null;
};

export { codeReaderMatcher };
