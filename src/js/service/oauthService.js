import { UserManager } from 'oidc-client-ts';
import { localStorageService } from './data/localStorageService';
import { constants } from '../util/constants';

let oauthService = {};
let managers = {}

oauthService.login = async function(config) {
    await oauthService.processCallbackData();
    if (await oauthService.isLoggedIn(config)) {
        log.debug(`OAuth: already logged in for ${config.id}!`);
        return;
    }
    let manager = await initManager(config);
    manager.signinRedirect();
}

oauthService.logout = async function(config) {
    let manager = await initManager(config);
    let user = await manager.getUser();
    await manager.revokeTokens();
    await manager.removeUser();
    log.debug(`oauth user for ${config.id} logged out!`);
}

oauthService.isLoggedIn = async function(config) {
    let user = await getUser(config);
    return user && user.access_token;
}

oauthService.processCallbackData = async function() {
    let paramsMap = localStorageService.getJSON(constants.OAUTH_RETURNED_PARAMS_MAP) || {};
    for (let id of Object.keys(paramsMap)) {
        let config = constants.OAUTH_CONFIGS.find(e => e.id === id);
        if (config) {
            log.debug(`processing OAuth parameters for ${config.id}, data: ${paramsMap[id]}`)
            let manager = await initManager(config);
            await manager.signinCallback(paramsMap[id]);
        }
        delete paramsMap[id];
        localStorageService.saveJSON(constants.OAUTH_RETURNED_PARAMS_MAP, paramsMap);
    }
}

oauthService.getAccessToken = async function(config) {
    let user = await getUser(config);
    return user ? user.access_token : "";
}

oauthService.getProfile = async function(config) {
    let user = await getUser(config);
    return user ? user.profile : null;
}

async function getUser(config) {
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