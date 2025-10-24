import { constants } from '../../util/constants';
import { GridPreview } from '../../model/GridPreview';
import { i18nService } from '../i18nService';
import { util } from '../../util/util';
import { fileUtil } from '../../util/fileUtil';
import { obfConverter } from '../../util/obfConverter';

let providerAGBoards = {};

let BASE_URL = "https://asterics.github.io/AsTeRICS-Grid-Boards/";
let GITHUB_BASE_URL = "https://github.com/asterics/AsTeRICS-Grid-Boards/";
let GITHUB_TREE_URL = `${GITHUB_BASE_URL}tree/main/`;
let METADATA_URL = constants.IS_ENVIRONMENT_PROD ? BASE_URL + "live_metadata.json" : BASE_URL + "live_metadata_beta.json";
let PROVIDER_NAME_OWN = "AsTeRICS Grid Boards";
let ownResults = [];
let searchTermsMap = new Map();
let translationMap = {};
let initResolve = null;
let initPromise = new Promise(resolve => {
    initResolve = resolve;
});

providerAGBoards.getName = function() {
    return PROVIDER_NAME_OWN;
}

providerAGBoards.getURL = function() {
    return GITHUB_BASE_URL;
}

/**
 * queries board previews according to given parameters
 * @param searchTerm a search term for filtering the results
 * @param options additional search options
 * @param options.type the type of board previews (self-contained or single boards), see constants.BOARD_TYPES
 * @param options.lang language code of the board previews that should be returned
 * @return {Promise<*[]>}
 */
providerAGBoards.query = async function (searchTerm = '', options = {}) {
    await initPromise;
    let results = ownResults;
    if (options.lang) {
        results = results.filter(preview => preview.languages.includes(options.lang) || preview.translate || preview.tags.includes('DEMO'));
    }
    if (options.type === constants.BOARD_TYPE_SELFCONTAINED) {
        results = results.filter(preview => preview.selfContained);
    }
    if (options.type === constants.BOARD_TYPE_SINGLE) {
        results = results.filter(preview => !preview.selfContained);
    }
    if (!searchTerm) {
        return sortResults(results, options);
    }
    searchTerm = searchTerm.replace(/\s+/g, ' '); // replace multiple spaces
    let searchWords = searchTerm.toLocaleLowerCase().split(' ');
    for (let word of searchWords) {
        results = results.filter(preview => searchTermsMap.get(preview).some(term => term.includes(word)));
    }
    return sortResults(results, options);
}

providerAGBoards.getImportData = async function(preview) {
    let isOBZ = fileUtil.isObzFile(preview.originalData.url);
    let result = await fileUtil.downloadFile(preview.url, { isBytes: isOBZ });
    if (result && isOBZ) {
        let obzFileMap = await fileUtil.readZip(result, {
            jsonFileExtensions: ['json', 'obf'],
            defaultEncoding: 'base64'
        });
        result = await obfConverter.OBZToImportData(obzFileMap);
    }
    return result;
}

async function fetchData() {
    let response = await fetch(METADATA_URL);
    let data = await response.json();
    ownResults = data.map(object => new GridPreview(object, { baseUrl: BASE_URL, githubEditable: true, githubBaseUrl: GITHUB_TREE_URL, hasGlobalGrid: true }));
    searchTermsMap = new Map();
    for (let preview of ownResults) {
        if (preview.translate) {
            preview.name = i18nService.t(preview.name);
            preview.description = i18nService.t(preview.description);
        } else {
            preview.name  = util.isString(preview.name ) ? preview.name  : i18nService.getTranslation(preview.name);
            preview.description = util.isString(preview.description) ? preview.description : i18nService.getTranslation(preview.description);
        }
        let searchTerms = [];
        if (util.isString(preview.name)) {
            searchTerms.push(preview.name.toLocaleLowerCase());
        } else {
            searchTerms.push(i18nService.getTranslation(preview.name).toLocaleLowerCase());
        }
        for (let tag of preview.tags) {
            searchTerms.push(translate(`tag.${tag}`));
        }
        searchTermsMap.set(preview, searchTerms);
    }
}

function sortResults(results, options) {
    results.sort((a, b) => {
        let prioA = Number.isInteger(a.priority) ? a.priority : (a.priority[options.lang] || 0);
        let prioB = Number.isInteger(b.priority) ? b.priority : (b.priority[options.lang] || 0);
        if (prioA !== prioB) {
            return prioB - prioA;
        }
        let nameA = util.isString(a.name) ? a.name : i18nService.getTranslation(a.name);
        let nameB = util.isString(b.name) ? b.name : i18nService.getTranslation(b.name);
        return nameA.localeCompare(nameB);
    });
    return results;
}

function translate(key) {
    if (translationMap[key]) {
        return translationMap[key];
    } else {
        let translation = i18nService.t(key).toLocaleLowerCase();
        translationMap[key] = translation;
        return translation;
    }
}

async function init() {
    try {
        await fetchData();
        initResolve();
    } catch (e) {
        log.warn(e);
    }
}
init();

export { providerAGBoards };