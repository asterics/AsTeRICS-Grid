import { providerGlobalSymbols } from './providerGlobalSymbols';
import { providerAGBoards } from './providerAGBoards';
import { constants } from '../../util/constants';

let externalBoardsService = {};

let externalProviders = [providerAGBoards, providerGlobalSymbols];

/**
 * queries board previews according to given parameters
 * @param searchTerm a search term for filtering the results
 * @param options additional search options
 * @param options.type the type of board previews (self-contained or single boards), see constants.BOARD_TYPES
 * @param options.lang language code of the board previews that should be returned
 * @param options.provider name of the provider to use, all providers if not specified
 * @param options.selfContained true, if self-contained boards should be returned, false if single boards should be returned,
 *                              if not specified depending on options.type or all types
 * @return {Promise<*[]>}
 */
externalBoardsService.query = async function (searchTerm = '', options = {}) {
    let promisesToProvider = new Map();
    options = JSON.parse(JSON.stringify(options));
    options.selfContained = options.selfContained || typeToSelfContained(options.type);
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

externalBoardsService.getPreview = async function(providerName, id) {
    let results = await externalBoardsService.query('', {
        provider: providerName
    });
    return results.find(result => result.id === id);
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
        if (a.originalData.download_count !== undefined && b.originalData.download_count !== undefined) {
            return b.originalData.download_count - a.originalData.download_count;
        }
        return b.name.localeCompare(a.name);
    });
    return results;
}

function typeToSelfContained(type) {
    switch (type) {
        case constants.BOARD_TYPE_SELFCONTAINED: return true;
        case constants.BOARD_TYPE_SINGLE: return false;
    }
    return undefined;
}

export { externalBoardsService };