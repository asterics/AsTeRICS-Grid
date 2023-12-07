import $ from '../../externals/jquery.js';
import { i18nService } from '../i18nService.js';
import { constants } from '../../util/constants.js';
import { GridImage } from '../../model/GridImage.js';

let arasaacService = {};

let _lastChunkSize = 20;
let _lastChunkNr = 1;
let _lastSearchTerm = null;
let _lastRawResultList = null;
let _hasNextChunk = false;
let _lastOptions = null;
let _lastSearchLang = null;
let arasaacAuthor = 'ARASAAC - CC (BY-NC-SA)';
let arasaacLicenseURL = 'https://arasaac.org/terms-of-use';
let supportedGrammarLangs = ['es'];
let apiBaseUrl = 'https://api.arasaac.org';

arasaacService.SEARCH_PROVIDER_NAME = 'ARASAAC';

let searchProviderInfo = {
    name: arasaacService.SEARCH_PROVIDER_NAME,
    url: 'https://arasaac.org/',
    searchLangs: [
        'an',
        'ar',
        'bg',
        'br',
        'ca',
        'de',
        'el',
        'en',
        'es',
        'et',
        'eu',
        'fa',
        'fr',
        'gl',
        'he',
        'hr',
        'hu',
        'it',
        'ko',
        'lt',
        'lv',
        'mk',
        'nl',
        'pl',
        'pt',
        'ro',
        'ru',
        'sk',
        'sq',
        'sv',
        'sr',
        'val',
        'uk',
        'zh'
    ],
    options: [
        {
            name: 'plural',
            type: constants.OPTION_TYPES.BOOLEAN,
            value: false
        },
        {
            name: 'color',
            type: constants.OPTION_TYPES.BOOLEAN,
            value: true
        },
        {
            name: 'action',
            type: constants.OPTION_TYPES.SELECT,
            value: undefined,
            options: ['past', 'future']
        },
        {
            name: 'skin',
            type: constants.OPTION_TYPES.SELECT_COLORS,
            value: undefined,
            options: ['white', 'black', 'assian', 'mulatto', 'aztec'],
            colors: ['#F5E5DE', '#A65C17', '#F4ECAD', '#E3AB72', '#CF9D7C']
        },
        {
            name: 'hair',
            type: constants.OPTION_TYPES.SELECT_COLORS,
            value: undefined,
            options: ['blonde', 'brown', 'darkBrown', 'gray', 'darkGray', 'red', 'black'],
            colors: ['#FDD700', '#A65E26', '#6A2703', '#EFEFEF', '#AAABAB', '#ED4120', '#020100']
        },
        {
            name: 'identifier',
            type: constants.OPTION_TYPES.SELECT,
            value: undefined,
            options: ['classroom', 'health', 'library', 'office']
        },
        {
            name: 'identifierPosition',
            type: constants.OPTION_TYPES.SELECT,
            value: undefined,
            options: ['left', 'right']
        }
    ]
};

arasaacService.getSearchProviderInfo = function () {
    let newInfo = JSON.parse(JSON.stringify(searchProviderInfo));
    newInfo.service = arasaacService;
    return newInfo;
};

arasaacService.getGridImageById = function (arasaacId) {
    if (!arasaacId) {
        return null;
    }
    return new GridImage({
        url: `${apiBaseUrl}/api/pictograms/${arasaacId}?download=false&plural=false&color=true`,
        author: arasaacAuthor,
        authorURL: arasaacLicenseURL,
        searchProviderName: arasaacService.SEARCH_PROVIDER_NAME
    });
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
arasaacService.query = function (search, options, searchLang) {
    _lastOptions = options;
    _lastChunkNr = 1;
    _hasNextChunk = false;
    return queryInternal(search, searchLang, 1, _lastChunkSize);
};

/**
 * retrieves the next chunk of images for a search that was previously done by arasaacService.query()
 * @return same as arasaacService.query()
 */
arasaacService.nextChunk = function () {
    _lastChunkNr++;
    return queryInternal(_lastSearchTerm, _lastSearchLang, _lastChunkNr, _lastChunkSize);
};

/**
 * returns true if there is a next chunk available that can be retrieved via arasaacService.nextChunk()
 *
 * @return {boolean}
 */
arasaacService.hasNextChunk = function () {
    return _hasNextChunk;
};

arasaacService.getUpdatedUrl = function (oldUrl, newOptions) {
    let id = oldUrl.substring(oldUrl.lastIndexOf('/') + 1, oldUrl.indexOf('?'));
    return getUrl(id, newOptions);
};

arasaacService.getCorrectGrammar = async function (text) {
    if (!text || !supportedGrammarLangs.includes(i18nService.getContentLang())) {
        return text;
    }
    text = text.trim();
    let contentLang = i18nService.getContentLang();
    let path = `${apiBaseUrl}/api/phrases/flex/${contentLang}/${text}`;
    let response = await fetch(path).catch((e) => console.error(e));
    if (!response || response.status !== 200) {
        return text;
    }
    let resultJSON = await response.json();
    return resultJSON ? resultJSON.msg + '' : text;
};

arasaacService.getSupportedGrammarLangs = function (translate) {
    let langs = supportedGrammarLangs;
    if (translate) {
        langs = langs.map((e) => i18nService.getTranslation(`lang.${e}`));
    }
    return JSON.parse(JSON.stringify(langs));
};

function getUrl(apiId, options) {
    let paramSuffix = '';
    options.forEach((option) => {
        if (option.value !== undefined) {
            paramSuffix += `&${option.name}=${encodeURIComponent(option.value)}`;
        }
    });
    return `${apiBaseUrl}/api/pictograms/${apiId}?download=false${paramSuffix}`;
}

function queryInternal(search, lang, chunkNr, chunkSize) {
    chunkSize = chunkSize || _lastChunkSize;
    chunkNr = chunkNr || 1;
    let queriedElements = [];
    return new Promise(async (resolve, reject) => {
        if (!search) {
            return resolve([]);
        }
        if (_lastSearchTerm !== search || _lastSearchLang !== lang) {
            lang = lang || i18nService.getContentLang();
            _lastSearchLang = lang;
            try {
                _lastRawResultList = await getResultListLangs(
                    [lang, i18nService.getContentLang(), i18nService.getBrowserLang(), 'en', 'es'],
                    search
                );
            } catch (e) {
                reject(e);
            }
        }

        if (!_lastRawResultList || !_lastRawResultList.length || _lastRawResultList.length === 0) {
            _lastRawResultList = [];
        }
        let startIndex = chunkNr * chunkSize - chunkSize;
        let endIndex = startIndex + chunkSize - 1;
        _hasNextChunk = _lastRawResultList.length > endIndex + 1;
        for (let i = startIndex; i <= endIndex; i++) {
            if (_lastRawResultList[i]) {
                let element = {};
                let apiElement = JSON.parse(JSON.stringify(_lastRawResultList[i]));
                element.url = getUrl(apiElement._id, _lastOptions);
                element.author = arasaacAuthor;
                element.authorURL = arasaacLicenseURL;
                element.searchProviderName = arasaacService.SEARCH_PROVIDER_NAME;
                element.searchProviderOptions = JSON.parse(JSON.stringify(_lastOptions));
                /*element.promise = imageUtil.urlToBase64(element.url, 500, 'image/png');
                element.promise.then((base64) => {
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
    });
}

async function getResultListLangs(langs, search) {
    langs = langs || [i18nService.getContentLang()];
    langs = [...new Set(langs)];
    let list = [];
    for (let lang of langs) {
        try {
            list = await getResultList(lang, search);
        } catch (e) {
            return Promise.reject(e);
        }
        if (list.length > 0) {
            return list;
        }
    }
    return list;
}

function getResultList(lang, search) {
    let url = `${apiBaseUrl}/api/pictograms/${lang}/search/${search}`;
    return new Promise((resolve, reject) => {
        $.get(
            url,
            null,
            function (resultList) {
                resolve(resultList);
            },
            'json'
        ).fail((reason) => {
            if (reason.status === 404) {
                return resolve([]);
            }
            reject('no internet');
        });
    });
}

export { arasaacService };
