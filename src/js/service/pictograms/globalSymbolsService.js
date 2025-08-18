import $ from '../../externals/jquery.js';

let API_SUGGEST_URL = 'https://globalsymbols.com/api/v1/concepts/suggest?query=';

let globalSymbolsService = {};

globalSymbolsService.SEARCH_PROVIDER_NAME = 'GLOBALSYMBOLS';

globalSymbolsService.PROP_IMAGE_URL = 'image_url';

let _lastChunkSize = 20;
let _lastChunkNr = 1;
let _lastSearchTerm = null;
let _lastRawResultList = null; // flattened list of pictos
let _hasNextChunk = false;

let searchProviderInfo = {
    name: globalSymbolsService.SEARCH_PROVIDER_NAME,
    url: 'https://globalsymbols.com/',
    service: globalSymbolsService
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
 * @param {string} searchLang currently unused (kept for interface compatibility)
 * @return Promise resolving to a list of search result objects with properties:
 *         element.url, element.author, element.authorURL, element.searchProviderName
 */
globalSymbolsService.query = function (search, options, searchLang) {
    _lastChunkNr = 1;
    _hasNextChunk = false;
    return queryInternal(search);
};

/**
 * retrieves the next chunk of images for a search that was previously done by globalSymbolsService.query()
 * @return same as globalSymbolsService.query()
 */
globalSymbolsService.nextChunk = function () {
    _lastChunkNr++;
    return queryInternal(_lastSearchTerm, _lastChunkNr, _lastChunkSize);
};

/**
 * returns true if there is a next chunk available that can be retrieved via globalSymbolsService.nextChunk()
 * @return {boolean}
 */
globalSymbolsService.hasNextChunk = function () {
    return _hasNextChunk;
};

function queryInternal(search, chunkNr, chunkSize) {
    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];
    return new Promise((resolve, reject) => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search) {
            $.get(API_SUGGEST_URL + encodeURIComponent(search), null, function (concepts) {
                // Flatten pictos from all concepts into a single list
                let flattened = [];
                if (Array.isArray(concepts)) {
                    for (let c of concepts) {
                        if (c && Array.isArray(c.pictos)) {
                            for (let p of c.pictos) {
                                if (p && p[globalSymbolsService.PROP_IMAGE_URL]) {
                                    flattened.push({
                                        url: p[globalSymbolsService.PROP_IMAGE_URL]
                                    });
                                }
                            }
                        }
                    }
                }
                _lastRawResultList = flattened;
                processResultList(flattened);
            }).fail(() => {
                reject('no internet');
            });
        } else {
            processResultList(_lastRawResultList || []);
        }

        function processResultList(resultList) {
            if (!resultList || !resultList.length || resultList.length === 0) {
                resultList = [];
            }
            let startIndex = chunkNr * chunkSize - chunkSize;
            let endIndex = startIndex + chunkSize - 1;
            _hasNextChunk = resultList.length > endIndex + 1;
            for (let i = startIndex; i <= endIndex; i++) {
                if (resultList[i]) {
                    let element = {};
                    element.url = resultList[i].url;
                    element.author = 'Global Symbols';
                    element.authorURL = 'https://globalsymbols.com/';
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

