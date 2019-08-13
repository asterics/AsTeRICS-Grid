import $ from 'jquery';
import {imageUtil} from "../util/imageUtil";

let QUERY_URL = 'https://www.opensymbols.org/api/v1/symbols/search?q=';
let openSymbolsService = {};
openSymbolsService.PROP_IMAGE_URL = 'image_url';
openSymbolsService.PROP_AUTHOR = 'author';
openSymbolsService.PROP_AUTHOR_URL = 'author_url';

let _lastChunkSize = 10;
let _lastChunkNr = 1;
let _lastSearchTerm = null;
let _lastRawResultList = null;
let _hasNextChunk = false;

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
openSymbolsService.query = function (search, chunkNr, chunkSize) {
    chunkNr = chunkNr || 1;
    _lastChunkNr = chunkNr;
    _lastChunkSize = chunkSize || _lastChunkSize;
    return queryInternal(search, chunkNr, chunkSize);
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

function queryInternal(search, chunkNr, chunkSize) {
    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];
    return new Promise(resolve => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search) {
            $.get(QUERY_URL + search, null, function (resultList) {
                _lastRawResultList = resultList;
                processResultList(resultList);
            });
        } else {
            processResultList(_lastRawResultList);
        }

        function processResultList(resultList) {
            if (!resultList || !resultList.length || resultList.length === 0) {
                resultList = [];
            }
            let startIndex = (chunkNr * chunkSize) - chunkSize;
            let endIndex = startIndex + chunkSize - 1;
            _hasNextChunk = resultList.length > (endIndex + 1);
            for (let i = startIndex; i <= endIndex; i++) {
                if (resultList[i]) {
                    let element = JSON.parse(JSON.stringify(resultList[i]));
                    let promise = imageUtil.urlToBase64(element[openSymbolsService.PROP_IMAGE_URL]);
                    element.promise = promise;
                    promise.then((base64) => {
                        if (base64) {
                            element.base64 = base64;
                        } else {
                            element.failed = true;
                        }
                    });
                    queriedElements.push(element);
                }
            }
            _lastSearchTerm = search;
            resolve(queriedElements);
        }
    });
}


export {openSymbolsService};