import $ from '../../externals/jquery.js';
import { util } from '../../util/util';
import { i18nService } from '../i18nService';
import { constants } from '../../util/constants.js';

let API_SUGGEST_URL = 'https://globalsymbols.com/api/v1/concepts/suggest';
let API_LABELS_URL = 'https://globalsymbols.com/api/v1/labels/search';
let API_SYMBOLSET_API = 'https://globalsymbols.com/api/v1/symbolsets';
let AUTHOR_DEFAULT = 'Global Symbols';
let AUTHOR_URL_DEFAULT = 'https://globalsymbols.com/';

let globalSymbolsService = {};

globalSymbolsService.SEARCH_PROVIDER_NAME = 'GLOBALSYMBOLS';

globalSymbolsService.PROP_IMAGE_URL = 'image_url';
globalSymbolsService.PROP_SYMBOLSET_ID = 'symbolset_id';
globalSymbolsService.PROP_PUBLISHER_URL = 'publisher_url';
globalSymbolsService.PROP_LICENSE = 'licence';

let _lastChunkSize = 20;
let _lastChunkNr = 1;
let _lastSearchTerm = null;
let _lastRawResultList = null; // flattened list of pictos
let _hasNextChunk = false;
let _symbolsetInfo = null;
let _lastLang = null;
let _lastOptions = null;
let _lastOptionsKey = null;

let searchProviderInfo = {
    name: globalSymbolsService.SEARCH_PROVIDER_NAME,
    url: 'https://globalsymbols.com/',
    service: globalSymbolsService,
    searchLangs: [ // see endpoint https://globalsymbols.com/api/docs#!/languages/getV1LanguagesActive - langs.map(lang => lang.iso639_1).filter(lang => !!lang).map(lang => `'${lang}'`).toString()
        'en','af','sq','am','ar','an','hy','as','az','ba','eu','bn','bs','br','bg','my','ca','zh','hr','cs','da','dv','nl','et','fo','fj','fi','fr','gl','lg','ka','de','gu','ht','ha','he','hi','hu','is','ig','id','iu','ga','it','ja','kn','ks','kk','km','rw','ky','ko','ku','lo','lv','ln','lt','mk','mg','ms','ml','mt','mi','mr','el','ne','nb','ny','or','pa','ps','fa','pl','pt','ro','rn','ru','sm','sr','sh','sn','sd','si','sk','sl','so','st','es','sw','sv','ty','ta','tt','te','th','bo','ti','to','tn','tr','tk','ug','uk','ur','uz','vi','cy','xh','yo','zu'
    ],
    options: [
        {
            name: 'expandSynonyms',
            type: constants.OPTION_TYPES.BOOLEAN,
            value: true  // Enable by default since it's core to GlobalSymbols' value
        },
        {
            name: 'symbolsets',
            type: constants.OPTION_TYPES.MULTI_SELECT,
            value: [],
            optionsFunction: getSymbolsetOptions
        }
    ]
};

globalSymbolsService.getSearchProviderInfo = function () {
    let newInfo = JSON.parse(JSON.stringify(searchProviderInfo));
    newInfo.service = globalSymbolsService;
    return newInfo;
};

/**
 * searches for images using Global Symbols API
 *
 * @param {string} search the keyword to use for searching
 * @param {Array} options currently unused (kept for interface compatibility)
 * @param {string} searchLang search language
 * @return Promise resolving to a list of search result objects with properties:
 *         element.url, element.author, element.authorURL, element.searchProviderName
 */
globalSymbolsService.query = function (search, options, searchLang) {
    _lastChunkNr = 1;
    _hasNextChunk = false;
    _lastOptions = options || JSON.parse(JSON.stringify(searchProviderInfo.options || []));
    _lastOptionsKey = buildOptionsKey(_lastOptions);
    _lastLang = searchLang || null;
    return queryInternal(search, _lastOptions, searchLang);
};

/**
 * retrieves the next chunk of images for a search that was previously done by globalSymbolsService.query()
 * @return same as globalSymbolsService.query()
 */
globalSymbolsService.nextChunk = function () {
    _lastChunkNr++;
    return queryInternal(_lastSearchTerm, _lastOptions, _lastLang, _lastChunkNr, _lastChunkSize);
};

/**
 * returns true if there is a next chunk available that can be retrieved via globalSymbolsService.nextChunk()
 * @return {boolean}
 */
globalSymbolsService.hasNextChunk = function () {
    return _hasNextChunk;
};

async function getSymbolSetInfos() {
    _symbolsetInfo = _symbolsetInfo || await util.fetchJson(API_SYMBOLSET_API);
    return _symbolsetInfo;
}

async function getSymbolsetOptions() {
    let infos = await getSymbolSetInfos() || [];
    let options = infos.map(info => ({ value: info.id, label: info.name })).sort((a,b) => (''+a.label).localeCompare(''+b.label));
    // Put ARASAAC at the top if present
    let idx = options.findIndex(o => /arasaac/i.test(o.label));
    if (idx > 0) {
        let ar = options.splice(idx,1)[0];
        options.unshift(ar);
    }
    return options;
}

globalSymbolsService.getSymbolsetOptions = getSymbolsetOptions;

async function getSymbolSetInfo(symbolSetId) {
    let infos = await getSymbolSetInfos() || [];
    return infos.find(info => info.id === symbolSetId) || { license: '' };
}

async function queryInternal(search, options, lang, chunkNr, chunkSize) {
    lang = lang || i18nService.getContentLangBase();
    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];

    // Build a simple key representing options relevant to data retrieval
    const currentOptionsKey = buildOptionsKey(options);

    return new Promise(async (resolve, reject) => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search || _lastLang !== lang || _lastOptionsKey !== currentOptionsKey) {
            // Determine selected symbolset IDs from options
            let selectedSymbolsetIds = [];
            if (options && Array.isArray(options)) {
                let symOpt = options.find(o => o && o.name === 'symbolsets');
                if (symOpt && Array.isArray(symOpt.value)) {
                    selectedSymbolsetIds = symOpt.value.map(v => typeof v === 'string' ? parseInt(v) : v).filter(v => !isNaN(v));
                }
            }

            // Determine if we should expand synonyms
            let expandSynonyms = false;
            if (options && Array.isArray(options)) {
                let opt = options.find(o => o && o.name === 'expandSynonyms');
                expandSynonyms = !!(opt && opt.value);
            }

            // Always start with labels/search as the base method
            let allPictos = new Map(); // dedupe by picto id

            // First: Get results from labels/search (always done)
            try {
                const labels = await util.fetchJson(`${API_LABELS_URL}?query=${encodeURIComponent(search)}&language=${lang}&language_iso_format=639-1`);
                if (Array.isArray(labels) && labels.length) {
                    for (let label of labels) {
                        if (label && label.picto && label.picto[globalSymbolsService.PROP_IMAGE_URL] && label.picto.id != null) {
                            if (!allPictos.has(label.picto.id)) {
                                allPictos.set(label.picto.id, {
                                    id: label.picto.id,
                                    url: label.picto[globalSymbolsService.PROP_IMAGE_URL],
                                    symbolsetId: label.picto[globalSymbolsService.PROP_SYMBOLSET_ID]
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                // ignore labels failure
            }

            // Second: If "expand with synonyms" is enabled, also search concepts for broader results
            if (expandSynonyms) {
                try {
                    const concepts = await util.fetchJson(`${API_SUGGEST_URL}?query=${encodeURIComponent(search)}&language=${lang}&language_iso_format=639-1`);
                    if (Array.isArray(concepts)) {
                        for (let c of concepts) {
                            if (c && Array.isArray(c.pictos)) {
                                for (let p of c.pictos) {
                                    if (p && p[globalSymbolsService.PROP_IMAGE_URL] && p.id != null) {
                                        if (!allPictos.has(p.id)) {
                                            allPictos.set(p.id, {
                                                id: p.id,
                                                url: p[globalSymbolsService.PROP_IMAGE_URL],
                                                symbolsetId: p[globalSymbolsService.PROP_SYMBOLSET_ID]
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    // ignore concepts failure
                }
            }

            let flattened = Array.from(allPictos.values());

            // Apply symbolset filtering if selected
            if (selectedSymbolsetIds.length > 0) {
                _lastRawResultList = flattened.filter(e => selectedSymbolsetIds.includes(e.symbolsetId));
            } else {
                _lastRawResultList = flattened;
            }
            _lastLang = lang;
            _lastOptionsKey = currentOptionsKey;
            processResultList(_lastRawResultList);
        } else {
            processResultList(_lastRawResultList || []);
        }

        async function processResultList(resultList) {
            if (!resultList || !resultList.length || resultList.length === 0) {
                resultList = [];
            }
            let startIndex = chunkNr * chunkSize - chunkSize;
            let endIndex = startIndex + chunkSize - 1;
            _hasNextChunk = resultList.length > endIndex + 1;
            for (let i = startIndex; i <= endIndex; i++) {
                if (resultList[i]) {
                    let symbolSetInfo = await getSymbolSetInfo(resultList[i].symbolsetId);
                    let author = AUTHOR_DEFAULT;
                    let authorURL = AUTHOR_URL_DEFAULT;
                    if (symbolSetInfo) {
                        author = symbolSetInfo.name;
                        if (symbolSetInfo[globalSymbolsService.PROP_LICENSE]) {
                            author = `${author} - ${symbolSetInfo[globalSymbolsService.PROP_LICENSE].name}`;
                        }
                        authorURL = symbolSetInfo[globalSymbolsService.PROP_PUBLISHER_URL];
                    }
                    let element = {};
                    element.url = resultList[i].url;
                    element.author = author;
                    element.authorURL = authorURL;
                    element.searchProviderName = globalSymbolsService.SEARCH_PROVIDER_NAME;
                    element.searchProviderOptions = JSON.parse(JSON.stringify(options || []));
                    queriedElements.push(element);
                }
            }
            _lastSearchTerm = search;
            resolve(queriedElements);
        }
    });
}

function buildOptionsKey(options) {
    try {
        if (!Array.isArray(options)) return '';
        let expand = options.find(o => o && o.name === 'expandSynonyms');
        let sets = options.find(o => o && o.name === 'symbolsets');
        return JSON.stringify({
            expand: !!(expand && expand.value),
            sets: Array.isArray(sets && sets.value) ? sets.value.slice().sort() : []
        });
    } catch (e) {
        return '';
    }
}

export { globalSymbolsService };

