import $ from '../../externals/jquery.js';
import { util } from '../../util/util';
import { i18nService } from '../i18nService';

let API_SUGGEST_URL = 'https://globalsymbols.com/api/v1/concepts/suggest';
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

let searchProviderInfo = {
    name: globalSymbolsService.SEARCH_PROVIDER_NAME,
    url: 'https://globalsymbols.com/',
    service: globalSymbolsService,
    searchLangs: [ // see endpoint https://globalsymbols.com/api/docs#!/languages/getV1LanguagesActive - langs.map(lang => lang.iso639_1).filter(lang => !!lang).map(lang => `'${lang}'`).toString()
        'en','af','sq','am','ar','an','hy','as','az','ba','eu','bn','bs','br','bg','my','ca','zh','hr','cs','da','dv','nl','et','fo','fj','fi','fr','gl','lg','ka','de','gu','ht','ha','he','hi','hu','is','ig','id','iu','ga','it','ja','kn','ks','kk','km','rw','ky','ko','ku','lo','lv','ln','lt','mk','mg','ms','ml','mt','mi','mr','el','ne','nb','ny','or','pa','ps','fa','pl','pt','ro','rn','ru','sm','sr','sh','sn','sd','si','sk','sl','so','st','es','sw','sv','ty','ta','tt','te','th','bo','ti','to','tn','tr','tk','ug','uk','ur','uz','vi','cy','xh','yo','zu'
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
    return queryInternal(search, searchLang);
};

/**
 * retrieves the next chunk of images for a search that was previously done by globalSymbolsService.query()
 * @return same as globalSymbolsService.query()
 */
globalSymbolsService.nextChunk = function () {
    _lastChunkNr++;
    return queryInternal(_lastSearchTerm, _lastLang, _lastChunkNr, _lastChunkSize);
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

async function getSymbolSetInfo(symbolSetId) {
    let infos = await getSymbolSetInfos() || [];
    return infos.find(info => info.id === symbolSetId) || { license: '' };
}

async function queryInternal(search, lang, chunkNr, chunkSize) {
    lang = lang || i18nService.getAppLang();
    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];
    return new Promise(async (resolve, reject) => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search) {
            let concepts = await util.fetchJson(`${API_SUGGEST_URL}?query=${encodeURIComponent(search)}&language=${lang}&language_iso_format=639-1`);
            if (!concepts) {
                reject('no internet');
            }
            // Flatten pictos from all concepts into a single list
            let flattened = [];
            if (Array.isArray(concepts)) {
                for (let c of concepts) {
                    if (c && Array.isArray(c.pictos)) {
                        for (let p of c.pictos) {
                            if (p && p[globalSymbolsService.PROP_IMAGE_URL]) {
                                flattened.push({
                                    url: p[globalSymbolsService.PROP_IMAGE_URL],
                                    symbolsetId: p[globalSymbolsService.PROP_SYMBOLSET_ID]
                                });
                            }
                        }
                    }
                }
            }
            _lastRawResultList = flattened;
            processResultList(flattened);
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
                    queriedElements.push(element);
                }
            }
            _lastSearchTerm = search;
            resolve(queriedElements);
        }
    });
}

export { globalSymbolsService };

