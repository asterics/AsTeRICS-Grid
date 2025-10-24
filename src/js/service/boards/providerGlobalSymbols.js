import { constants } from '../../util/constants';
import { GridPreview } from '../../model/GridPreview';
import $ from '../../externals/jquery';
import { obfConverter } from '../../util/obfConverter';

let providerGlobalSymbols = {};


providerGlobalSymbols.getName = function() {
    return "Global Symbols";
}

providerGlobalSymbols.getURL = function() {
    return constants.GLOBALSYMBOLS_BASE_URL;
}

/**
 * queries board previews according to given parameters
 * @param searchTerm a search term for filtering the results
 * @param options additional search options
 * @param options.lang language code of the board previews that should be returned
 * @param options.selfContained true: return self-contained boards, false: single boards, undefined: all boards
 * @return {Promise<*[]>}
 */
providerGlobalSymbols.query = async function (searchTerm = '', options = {}) {
    options.lang = options.lang || '';
    options.selfContained = options.selfContained === undefined ? '' : options.selfContained;
    let response = await fetch(`${constants.GLOBALSYMBOLS_BASE_URL}api/boardbuilder/v1/board_sets/public?search=${searchTerm}&lang=${options.lang}&self_contained=${options.selfContained}`);
    let data = await response.json();
    return data.map(object => new GridPreview(translateProps(object)));
}

providerGlobalSymbols.getImportData = async function(preview) {
    let result = await $.get(`${constants.GLOBALSYMBOLS_BASE_URL}api/boardbuilder/v1/board_sets/public/obz/${preview.originalData.id}`);
    if (result && result.obz_file_map) {
        return await obfConverter.OBZToImportData(result.obz_file_map);
    }
    return null;
};

function translateProps(object) {
    object.languages = [];
    if (object.lang) {
        object.languages = [object.lang];
    }
    object.thumbnail = object.thumbnail_url;
    object.website = object.author_url;
    return object;
}

export { providerGlobalSymbols };