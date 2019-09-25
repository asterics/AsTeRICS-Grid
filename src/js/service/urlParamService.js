let urlParamService = {};

let PARAM_DEMO_MODE = 'demo';
let PARAM_SCANNING = 'scanning';
let PARAM_HUFFMAN = 'huffman';
let PARAM_DIR_INPUT = 'direction';
let PARAM_RESET_DATABASE = 'reset';
let PARAM_DEFAULT_GRIDSET = 'default';

urlParamService.isDemoMode = function () {
    return hasParam(PARAM_DEMO_MODE);
};

urlParamService.isScanningEnabled = function () {
    return hasParam(PARAM_SCANNING) && !isParamFalse(PARAM_SCANNING);
};

urlParamService.isDirectionEnabled = function () {
    return hasParam(PARAM_DIR_INPUT) && !isParamFalse(PARAM_DIR_INPUT);
};

urlParamService.isHuffmanEnabled = function () {
    return hasParam(PARAM_HUFFMAN) && !isParamFalse(PARAM_HUFFMAN);
};

urlParamService.shouldResetDatabase = function () {
    return urlParamService.isDemoMode() || isParamTrue(PARAM_RESET_DATABASE);
};

urlParamService.getDefaultGridsetName = function () {
    return getParam(PARAM_DEFAULT_GRIDSET);
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

export {urlParamService};