import { providerGlobalSymbols } from './providerGlobalSymbols';
import { providerAGBoards } from './providerAGBoards';

let externalBoardsService = {};

let externalProviders = [providerAGBoards, providerGlobalSymbols];

/**
 * queries board previews according to given parameters
 * @param searchTerm a search term for filtering the results
 * @param options additional search options
 * @param options.type the type of board previews (self-contained or single boards), see constants.BOARD_TYPES
 * @param options.lang language code of the board previews that should be returned
 * @param options.provider name of the provider to use, all providers if not specified
 * @return {Promise<*[]>}
 */
externalBoardsService.query = async function (searchTerm = '', options = {}) {
    let promisesToProvider = new Map();
    for (let provider of externalProviders) {
        if (!options.provider || options.provider === provider.getName()) {
            let promise = provider.query(searchTerm, options);
            promisesToProvider.set(promise, provider);
        }
    }
    await Promise.all(promisesToProvider.keys());
    let results = [];
    for (let promise of promisesToProvider.keys()) {
        let newResults = await promise;
        for (let result of newResults) {
            result.providerName = promisesToProvider.get(promise).getName();
            result.providerUrl = promisesToProvider.get(promise).getURL();
        }
        results = results.concat(newResults);
    }
    results = sortResults(results, options);
    return results;
};

/**
 * returns the preview for a given filename for the results coming from AsTeRICS-Grid-Boards
 * @param filename
 * @return {*|string}
 */
externalBoardsService.getAGBoardsPreview = async function(filename) {
    let results = await externalBoardsService.query('', {
        provider: providerAGBoards.getName()
    });
    return results.find(preview => preview.filename === filename);
}

externalBoardsService.getProviders = function() {
    let names = [];
    for (let provider of externalProviders) {
        names.push(provider.getName())
    }
    return names;
}

externalBoardsService.getImportData = async function(preview) {
    let provider = externalProviders.find(p => p.getName() === preview.providerName);
    if (provider) {
        try {
            return await provider.getImportData(preview);
        } catch (e) {
            log.warn(`failed to get data from provider ${provider.getName()}`, e);
        }
    }
    return null;
}

function sortResults(results, options) {
    results.sort((a, b) => {
        if (a.providerName !== b.providerName) {
            if (a.providerName === providerAGBoards.getName()) {
                return -1;
            }
            if (b.providerName === providerAGBoards.getName()) {
                return 1;
            }
        }
        let prioA = Number.isInteger(a.priority) ? a.priority : (a.priority[options.lang] || 0);
        let prioB = Number.isInteger(b.priority) ? b.priority : (b.priority[options.lang] || 0);
        if (prioA !== prioB) {
            return prioB - prioA;
        }
        return b.name.localeCompare(a.name);
    });
    return results;
}

export { externalBoardsService };