let urlParamService = {};

urlParamService.params = {
    PARAM_DEMO_MODE: 'demo',
    PARAM_SCANNING: 'scanning',
    PARAM_HUFFMAN: 'huffman',
    PARAM_DIR_INPUT: 'direction',
    PARAM_RESET_DATABASE: 'reset',
    PARAM_DEFAULT_GRIDSET: 'default'
}

let _demoMode = false;
let _alreadyResetted = false;

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
    let shouldReset = !_alreadyResetted && (urlParamService.isDemoMode() || isParamTrue(urlParamService.params.PARAM_RESET_DATABASE));
    _alreadyResetted = true;
    return shouldReset;
};

urlParamService.getDefaultGridsetName = function () {
    return getParam(urlParamService.params.PARAM_DEFAULT_GRIDSET);
};


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
        let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname +  searchString + window.location.hash;
        history.replaceState(null, '', newUrl);
    }
}

export {urlParamService};