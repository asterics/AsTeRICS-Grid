import { globalSymbolsService } from './globalSymbolsService.js';
import { arasaacService } from './arasaacService.js';
import { openSymbolsService } from './openSymbolsService.js';
import { i18nService } from '../i18nService.js';

// Minimal LRU cache for (provider|lang|word) -> { url, author, authorURL, searchProviderName }
const MAX_CACHE_SIZE = 200;
const cache = new Map(); // key: `${provider}|${lang}|${word}`

function setCache(key, value) {
    if (cache.has(key)) {
        cache.delete(key);
    }
    cache.set(key, value);
    if (cache.size > MAX_CACHE_SIZE) {
        // delete oldest
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
}

function getCache(key) {
    if (!cache.has(key)) return null;
    const val = cache.get(key);
    // mark as most recently used
    cache.delete(key);
    cache.set(key, val);
    return val;
}

let pictogramPredictionService = {};

/**
 * Get a pictogram for a single word using Global Symbols, with in-memory caching.
 * Returns an object similar to search results: { url, author, authorURL, searchProviderName }
 */
pictogramPredictionService.getPictoForWord = async function(word, lang, providerName) {
    if (!word || !(word + '').trim()) return null;
    const provider = (providerName || 'GLOBALSYMBOLS').toUpperCase();
    // Ensure we always have a language: metadata -> content -> browser -> 'en'
    const effectiveLang = (lang && lang.trim()) || i18nService.getContentLangBase() || i18nService.getBrowserLang() || 'en';
    const langKey = (effectiveLang || '').toLowerCase();
    const key = `${provider}|${langKey}|${(word + '').toLowerCase()}`;
    const cached = getCache(key);
    if (cached) return cached;

    try {
        let results = [];
        if (provider === 'ARASAAC') {
            results = await arasaacService.query(word, undefined, effectiveLang);
        } else if (provider === 'OPENSYMBOLS') {
            results = await openSymbolsService.query(word);
        } else { // GLOBALSYMBOLS default
            results = await globalSymbolsService.query(word, undefined, effectiveLang);
        }
        const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
        if (first && first.url) {
            setCache(key, first);
            return first;
        }
    } catch (e) {
    }
    return null;
};

/**
 * Batch helper: fetch pictos for multiple words.
 * Returns a map: { [word]: result|null }
 */
pictogramPredictionService.getPictosForWords = async function(words, lang, providerName) {
    const out = {};
    if (!Array.isArray(words)) return out;
    for (let w of words) {
        out[w] = await pictogramPredictionService.getPictoForWord(w, lang, providerName);
    }
    return out;
};

export { pictogramPredictionService };

