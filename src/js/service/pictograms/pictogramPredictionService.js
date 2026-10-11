import { globalSymbolsService } from './globalSymbolsService.js';
import { arasaacService } from './arasaacService.js';
import { openSymbolsService } from './openSymbolsService.js';
import { i18nService } from '../i18nService.js';
import { dataService } from '../data/dataService.js';

// Minimal LRU cache for (provider|lang|word) -> { url, author, authorURL, searchProviderName }
const MAX_CACHE_SIZE = 1000;
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

// In-memory index of user-defined pictos by lang -> word -> picto
// Value shape: { url, author: 'User', authorURL: null, searchProviderName: 'USER' }
const userPictoIndex = new Map(); // key: langKey -> Map(wordLower -> picto)
let _indexedUserFor = null; // track which user we indexed for

function invalidateUserPictoIndex() {
    userPictoIndex.clear();
    _indexedUserFor = null;
}

// Patch dataService save/update methods to invalidate index on grid changes
(function patchDataServiceForPictoIndexInvalidation() {
    try {
        const wrap = (fnName) => {
            if (typeof dataService[fnName] !== 'function') return;
            const orig = dataService[fnName].bind(dataService);
            dataService[fnName] = async function(...args) {
                const res = await orig(...args);
                invalidateUserPictoIndex();
                return res;
            };
        };
        wrap('saveGrid');
        wrap('saveGrids');
        wrap('updateGrid');
    } catch (e) {
        // ignore if patching fails; will rebuild on-demand per user change
    }
})();

async function ensureUserPictoIndex(langKey) {
    const currentUser = await dataService.getCurrentUser();
    const indexKey = `${currentUser || 'default'}|${langKey}`;
    if (_indexedUserFor === indexKey && userPictoIndex.has(langKey)) {
        return; // already built for this user+lang
    }
    // Build (or rebuild) index
    const map = new Map();
    try {
        // Load full grids to also include data URLs
        const grids = await dataService.getGrids(true, false);
        for (let grid of (grids || [])) {
            const elements = (grid && grid.gridElements) || [];
            for (let elem of elements) {
                if (!elem || !elem.image) continue;
                // pick label in requested lang if available; else skip
                const labels = elem.label || {};
                const label = (labels && (labels[langKey] || labels[langKey.toLowerCase()]));
                if (!label || !(label + '').trim()) continue;
                const word = (label + '').trim().toLowerCase();
                const img = elem.image;
                const url = img.data ? img.data : img.url; // prefer data if present
                if (!url) continue;
                if (!map.has(word)) {
                    map.set(word, { url, author: 'User', authorURL: null, searchProviderName: 'USER' });
                }
            }
        }
        userPictoIndex.set(langKey, map);
        _indexedUserFor = indexKey;
    } catch (e) {
        // on error, keep index empty to avoid blocking
        userPictoIndex.set(langKey, new Map());
        _indexedUserFor = indexKey;
    }
}

async function getUserDefinedPicto(word, langKey) {
    if (!word) return null;
    await ensureUserPictoIndex(langKey);
    const map = userPictoIndex.get(langKey);
    return map ? map.get((word + '').toLowerCase()) : null;
}

let pictogramPredictionService = {};

/**
 * Get a pictogram for a single word, prioritizing user-defined symbols.
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

    // 1) Prefer user-defined pictograms
    const userPicto = await getUserDefinedPicto(word, langKey);
    if (userPicto && userPicto.url) {
        setCache(key, userPicto);
        return userPicto;
    }

    // 2) Fallback to external providers
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

// Expose manual invalidation if needed by other modules
pictogramPredictionService.invalidateCache = function() {
    invalidateUserPictoIndex();
};

export { pictogramPredictionService };

