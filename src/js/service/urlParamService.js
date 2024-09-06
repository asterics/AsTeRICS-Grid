import { providerAGBoards } from './boards/providerAGBoards';

let urlParamService = {};

urlParamService.params = {
    PARAM_DEMO_MODE: 'demo',
    PARAM_SCANNING: 'scanning',
    PARAM_HUFFMAN: 'huffman',
    PARAM_DIR_INPUT: 'direction',
    PARAM_RESET_DATABASE: 'reset',
    PARAM_USE_GRIDSET_FILENAME: 'gridset_filename',
    PARAM_USE_GRIDSET_PROVIDER: 'gridset_provider',
    PARAM_USE_GRIDSET_ID: 'gridset_id',
    PARAM_USE_GRIDSET_SINGLE_BOARDS: 'single_boards',
    PARAM_ELEMENT_HIGHLIGHT_IDS: "highlightIds"
};

let _demoMode = false;
let _alreadyResetted = false;

/**
 * sets many params to search params in the current URL
 * @param params an object containing key/value pairs to add
 */
urlParamService.setParamsToSearchQuery = function(params = {}) {
    let queryParams = new URLSearchParams(location.search);
    for (let key of Object.keys(params)) {
        if (params[key]) {
            queryParams.set(key, JSON.stringify(params[key]));
        } else {
            queryParams.delete(key);
        }
    }
    setURLSearchParamsToURL(queryParams);
}

/**
 * gets an object with keys/values of the search query params of the current url
 * @additionalParams object with additional params, which are added to the search query params
 */
urlParamService.getSearchQueryParams = function(additionalParams = {}) {
    let params = new URLSearchParams(location.search);
    let paramObject = Object.fromEntries(params);
    for (let key of Object.keys(paramObject)) {
        try {
            paramObject[key] = JSON.parse(paramObject[key]);
        } catch (e) {
        }
    }
    return Object.assign(paramObject, additionalParams);
};

urlParamService.isDemoMode = function () {
    _demoMode = _demoMode || hasParam(urlParamService.params.PARAM_DEMO_MODE);
    removeParam(urlParamService.params.PARAM_DEMO_MODE);
    return _demoMode;
};

urlParamService.isScanningEnabled = function () {
    return hasParam(urlParamService.params.PARAM_SCANNING) && !isParamFalse(urlParamService.params.PARAM_SCANNING);
};

urlParamService.isDirectionEnabled = function () {
    return hasParam(urlParamService.params.PARAM_DIR_INPUT) && !isParamFalse(urlParamService.params.PARAM_DIR_INPUT);
};

urlParamService.isHuffmanEnabled = function () {
    return hasParam(urlParamService.params.PARAM_HUFFMAN) && !isParamFalse(urlParamService.params.PARAM_HUFFMAN);
};

urlParamService.shouldResetDatabase = function () {
    let shouldReset =
        !_alreadyResetted && (urlParamService.isDemoMode() || isParamTrue(urlParamService.params.PARAM_RESET_DATABASE));
    _alreadyResetted = true;
    return shouldReset;
};


urlParamService.getParam = function (name) {
    return getParam(name);
}

urlParamService.removeParam = function(name) {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.delete(name);
    setURLSearchParamsToURL(searchParams);
}

urlParamService.getImportGridsetProps = function() {
    let id = urlParamService.getParam(urlParamService.params.PARAM_USE_GRIDSET_ID) || urlParamService.getParam(urlParamService.params.PARAM_USE_GRIDSET_FILENAME);
    let provider = urlParamService.getParam(urlParamService.params.PARAM_USE_GRIDSET_PROVIDER) || providerAGBoards.getName();
    let singleBoards = urlParamService.getParam(urlParamService.params.PARAM_USE_GRIDSET_SINGLE_BOARDS) || false;
    if (id && provider) {
        return {
            id: id,
            provider: provider,
            singleBoards: singleBoards
        };
    }
    return null;
};

urlParamService.removeImportGridsetProps = function() {
    urlParamService.removeParam(urlParamService.params.PARAM_USE_GRIDSET_FILENAME);
    urlParamService.removeParam(urlParamService.params.PARAM_USE_GRIDSET_ID);
    urlParamService.removeParam(urlParamService.params.PARAM_USE_GRIDSET_PROVIDER);
    urlParamService.removeParam(urlParamService.params.PARAM_USE_GRIDSET_SINGLE_BOARDS);
}

function setURLSearchParamsToURL (searchParams) {
    let questionMark = searchParams.size > 0 ? "?" : "";
    history.replaceState(null, null, `${location.pathname}${questionMark}${searchParams.toString()}${location.hash}`);
}

function hasParam(name) {
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.has(name);
}

function getParam(name) {
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
}

function isParamTrue(name) {
    return getParam(name) === 'true';
}

function isParamFalse(name) {
    return getParam(name) === 'false';
}

function removeParam(paramName) {
    if (!hasParam(paramName)) {
        return;
    }
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.delete(paramName);
    if (history.replaceState) {
        let searchString = searchParams.toString().length > 0 ? '?' + searchParams.toString() : '';
        let newUrl =
            window.location.protocol +
            '//' +
            window.location.host +
            window.location.pathname +
            searchString +
            window.location.hash;
        history.replaceState(null, '', newUrl);
    }
}

export { urlParamService };
