import { GridPreview } from '../../model/GridPreview';
import { i18nService } from '../i18nService';
import { util } from '../../util/util';
import { constants } from '../../util/constants';

let boardService = {};

let BASE_URL = "https://asterics.github.io/AsTeRICS-Grid-Boards/";
let GITHUB_BASE_URL = "https://github.com/asterics/AsTeRICS-Grid-Boards/tree/main/";
let METADATA_URL = constants.IS_ENVIRONMENT_PROD ? BASE_URL + "live_metadata.json" : BASE_URL + "live_metadata_beta.json";
let ownResults = [];
let searchTermsMap = new Map();
let translationMap = {};
let initResolve = null;
let initPromise = new Promise(resolve => {
    initResolve = resolve;
});

/**
 * queries board previews according to given parameters
 * @param searchTerm a search term for filtering the results
 * @param options additional search options
 * @param options.type the type of board previews (self-contained or single boards), see constants.BOARD_TYPES
 * @param options.lang language code of the board previews that should be returned
 * @return {Promise<*[]>}
 */
boardService.query = async function (searchTerm = '', options = {}) {
    await initPromise;
    let results = ownResults;
    if (options.lang) {
        results = results.filter(preview => preview.languages.includes(options.lang) || preview.translate);
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
};

/**
 * returns the preview for a given filename for the results coming from AsTeRICS-Grid-Boards
 * @param filename
 * @return {*|string}
 */
boardService.getPreview = function(filename) {
    return  ownResults.find(preview => preview.filename === filename);
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

async function fetchData() {
    let response = await fetch(METADATA_URL);
    let data = await response.json();
    ownResults = data.map(object => new GridPreview(object, { baseUrl: BASE_URL, githubEditable: true, githubBaseUrl: GITHUB_BASE_URL }));
    searchTermsMap = new Map();
    for (let preview of ownResults) {
        if (preview.translate) {
            preview.name = i18nService.t(preview.name);
            preview.description = i18nService.t(preview.description);
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
        return nameB.localeCompare(nameA);
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

export { boardService };