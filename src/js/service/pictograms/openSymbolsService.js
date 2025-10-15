import $ from '../../externals/jquery.js';
import { imageUtil } from '../../util/imageUtil';
import { constants } from '../../util/constants.js';

let QUERY_URL = 'https://www.opensymbols.org/api/v1/symbols/search?q=';
let openSymbolsService = {};
openSymbolsService.PROP_IMAGE_URL = 'image_url';
openSymbolsService.PROP_AUTHOR = 'author';
openSymbolsService.PROP_AUTHOR_URL = 'author_url';
openSymbolsService.SEARCH_PROVIDER_NAME = 'OPENSYMBOLS';

let _lastChunkSize = 20;
let _lastChunkNr = 1;
let _lastSearchTerm = null;
let _lastRawResultList = null;
let _hasNextChunk = false;

let searchProviderInfo = {
    name: openSymbolsService.SEARCH_PROVIDER_NAME,
    url: 'https://www.opensymbols.org/',
    service: openSymbolsService,
    options: [
        {
            name: 'repositories',
            type: constants.OPTION_TYPES.MULTI_SELECT,
            value: [], // Empty array means all repositories selected
            options: [
                { value: 'arasaac', label: 'ARASAAC' },
                { value: 'noun-project', label: 'Noun Project' },
                { value: 'twemoji', label: 'Twemoji' },
                { value: 'sclera', label: 'Sclera' },
                { value: 'mulberry', label: 'Mulberry' },
                { value: 'tawasol', label: 'Tawasol' },
                { value: 'icomoon', label: 'IcoMoon' },
                { value: 'icon_archive', label: 'Icon Archive' },
                { value: 'language_craft', label: 'Language Craft' },
                { value: 'coughdrop_symbols', label: 'CoughDrop Symbols' },
                { value: 'word_art', label: 'Word Art' }
            ]
        }
    ]
};

openSymbolsService.getSearchProviderInfo = function () {
    let newInfo = JSON.parse(JSON.stringify(searchProviderInfo));
    newInfo.service = openSymbolsService;
    return newInfo;
};

/**
 * searches for images
 *
 * @param search the keyword to use for searching
 * @param chunkNr the chunk number to return, "1" means elements [0..chunkSize-1] are returned, "2" means
 *        elements [chunkSize..2*chunkSize-1] are returned.
 * @param chunkSize the number of elements that are returned in one bunch
 * @return list of search result objects with the following properties:
 *         element.base64 ... base64 encoded data string representing the image
 *         element.promise ... a promise that resolves as soon as element.base64 is available
 *         element.failed ... is 'true' is retrieving of base64 data failed
 *         element.author ... name of the author of the image
 *         additional all properties that are received from opensymbols.org API are available: https://www.opensymbols.org/api/v1/symbols/search?q=test
 */
openSymbolsService.query = function (search, options) {
    _lastChunkNr = 1;
    _hasNextChunk = false;
    return queryInternal(search, options);
};

/**
 * retrieves the next chunk of images for a search that was previously done by openSymbolsService.query()
 * @return same as openSymbolsService.query()
 */
openSymbolsService.nextChunk = function () {
    _lastChunkNr++;
    return queryInternal(_lastSearchTerm, _lastChunkNr, _lastChunkSize);
};

/**
 * returns true if there is a next chunk available that can be retrieved via openSymbolsService.nextChunk()
 *
 * @return {boolean}
 */
openSymbolsService.hasNextChunk = function () {
    return _hasNextChunk;
};

function queryInternal(search, optionsOrChunkNr, chunkSize) {
    // Handle backward compatibility - if second param is a number, it's chunkNr
    let options, chunkNr;
    if (typeof optionsOrChunkNr === 'number') {
        chunkNr = optionsOrChunkNr;
        options = null;
    } else {
        options = optionsOrChunkNr;
        chunkNr = 1;
    }

    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];
    return new Promise((resolve, reject) => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search) {
            $.get(QUERY_URL + search, null, function (resultList) {
                _lastRawResultList = resultList;
                processResultList(resultList, options);
            }).fail(() => {
                reject('no internet');
            });
        } else {
            processResultList(_lastRawResultList, options);
        }

        function processResultList(resultList, options) {
            if (!resultList || !resultList.length || resultList.length === 0) {
                resultList = [];
            }

            // Filter by repositories if specified
            let filteredList = resultList;
            if (options) {
                let repositoriesOption = options.find(opt => opt.name === 'repositories');
                if (repositoriesOption && repositoriesOption.value && repositoriesOption.value.length > 0) {
                    // Filter to only include selected repositories
                    filteredList = resultList.filter(item =>
                        item.repo_key && repositoriesOption.value.includes(item.repo_key)
                    );
                }
            }

            let startIndex = chunkNr * chunkSize - chunkSize;
            let endIndex = startIndex + chunkSize - 1;
            _hasNextChunk = filteredList.length > endIndex + 1;
            for (let i = startIndex; i <= endIndex; i++) {
                if (filteredList[i]) {
                    let element = {};
                    let apiElement = JSON.parse(JSON.stringify(filteredList[i]));
                    element.url = apiElement[openSymbolsService.PROP_IMAGE_URL];
                    element.author = apiElement[openSymbolsService.PROP_AUTHOR];
                    element.authorURL = apiElement[openSymbolsService.PROP_AUTHOR_URL];
                    element.searchProviderName = openSymbolsService.SEARCH_PROVIDER_NAME;
                    element.searchProviderOptions = options;
                    /*let promise = imageUtil.urlToBase64(element.url);
                    element.promise = promise;
                    promise.then((base64) => {
                        if (base64) {
                            element.data = base64;
                        } else {
                            element.failed = true;
                        }
                    });*/
                    queriedElements.push(element);
                }
            }
            _lastSearchTerm = search;
            resolve(queriedElements);
        }
    });
}

export { openSymbolsService };
