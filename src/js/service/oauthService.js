import { UserManager } from 'oidc-client-ts';
import { localStorageService } from './data/localStorageService';
import { constants } from '../util/constants';

let oauthService = {};
let managers = {}

oauthService.login = async function(config) {
    if (await oauthService.isLoggedIn(config)) {
        log.debug(`OAuth: already logged in for ${config.id}!`);
        return;
    }
    try {
        let manager = await initManager(config);
        await manager.signinRedirect();
    } catch (e) {
        log.warn(`failed to redirect to authorization page for ${config.id}`);
    }

}

oauthService.logout = async function(config) {
    let manager = await initManager(config);
    await manager.revokeTokens();
    await manager.removeUser();
    log.debug(`oauth user for ${config.id} logged out!`);
}

oauthService.isLoggedIn = async function(config) {
    let user = await oauthService.getUser(config);
    return !!user && !!user.access_token;
}

/**
 * Processes data returned by OAuth callback, which was saved within constants.OAUTH_RETURNED_PARAMS_MAP in
 * local storage. Data in local storage is cleared after processing.
 * @return {Promise<boolean>} true, there was data to process, false otherwise
 */
oauthService.processCallbackData = async function() {
    let processedData = false;
    let paramsMap = localStorageService.getJSON(constants.OAUTH_RETURNED_PARAMS_MAP) || {};
    for (let id of Object.keys(paramsMap)) {
        let config = constants.OAUTH_CONFIGS.find(e => e.id === id);
        if (config) {
            log.debug(`processing OAuth parameters for ${config.id}, data: ${paramsMap[id]}`)
            processedData = true;
            try {
                let manager = await initManager(config);
                await manager.signinCallback(paramsMap[id]);
            } catch (e) {
                log.warn("failed to process OAuth callback data.", e);
            }
        }
        delete paramsMap[id];
        localStorageService.saveJSON(constants.OAUTH_RETURNED_PARAMS_MAP, paramsMap);
    }
    return processedData;
}

oauthService.getAccessToken = async function(config) {
    let user = await oauthService.getUser(config);
    return user ? user.access_token : "";
}

oauthService.getProfile = async function(config) {
    let user = await oauthService.getUser(config);
    return user ? user.profile : null;
}

oauthService.getUser = async function(config) {
    let manager = await initManager(config);
    if (!manager) {
        log.warn(`manager with id ${config.id} not existing!`);
        return null;
    }
    return await manager.getUser();
}

async function initManager(config) {
    if (!managers[config.id]) {
        managers[config.id] = new UserManager(config);
        managers[config.id].events.addAccessTokenExpired(function() {
            log.debug("auto-renewing access token...")
            managers[config.id].signinSilent();
        })
    }
    return managers[config.id];
}

export { oauthService };