import { constants } from '../../util/constants';
import { oauthService } from './oauthService';
import { dataService } from '../data/dataService';
import { i18nService } from '../i18nService';
import $ from '../../externals/jquery';

let oauthServiceGlobalSymbols = {};

oauthServiceGlobalSymbols.isLoggedIn = function() {
    return oauthService.isLoggedIn(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
}

oauthServiceGlobalSymbols.login = function() {
    return oauthService.login(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
}

oauthServiceGlobalSymbols.logout = function() {
    return oauthService.logout(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
}

oauthServiceGlobalSymbols.getAccessToken = async function() {
    return await oauthService.getAccessToken(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
}

oauthServiceGlobalSymbols.getUsername = async function() {
    if (!oauthServiceGlobalSymbols.isLoggedIn()) {
        return '';
    }
    let user = await oauthService.getUser(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
    return user && user.profile ? user.profile.name : '';
}

oauthServiceGlobalSymbols.exportGrids = async function(gridIds, uploadMetadata = {
    name: '',
    description: '',
    tags: [],
    lang: '',
    author: '',
    author_url: '',
    self_contained: false,
    public: true,
    thumbnail: '',
}, progressFn = () => {}) {
    if (!oauthServiceGlobalSymbols.isLoggedIn()) {
        return;
    }
    progressFn(10);
    let backupData = await dataService.getBackupData(gridIds, {
        obzFileMap: true
    });
    progressFn(20);
    let accessToken = await oauthServiceGlobalSymbols.getAccessToken();
    let sendData = {
        obz_file_map: JSON.stringify(backupData),
        lang: i18nService.getContentLang(),
        self_contained: uploadMetadata.self_contained || false,
        public: uploadMetadata.public === true,
    }
    for (let key of Object.keys(uploadMetadata)) {
        sendData[key] = uploadMetadata[key] || sendData[key];
    }
    let metadata = await dataService.getMetadata();
    let thumbGridId = metadata.homeGridId || gridIds[0];
    let firstGrid = await dataService.getGrid(thumbGridId) || {};
    let firstThumb = firstGrid.thumbnail ? firstGrid.thumbnail.data : '';
    sendData.thumbnail = sendData.thumbnail || firstThumb;
    progressFn(30);
    let result = await $.ajax({
        type: 'POST',
        url: `${constants.GLOBALSYMBOLS_BASE_URL}api/boardbuilder/v1/board_sets/obz`,
        data: sendData,
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
    progressFn(100);
}

window.deleteGSResources = deleteGSResources;
async function deleteGSResources(deleteImages, deleteBoardSets) {
    if (!deleteImages && !deleteBoardSets) {
        log.warn('dry run, set params deleteAll(deleteImages, deleteBoardSets) to specify what to delete.');
    }
    await oauthServiceGlobalSymbols.login();
    let accessToken = await oauthServiceGlobalSymbols.getAccessToken();

    let boardSets = await $.ajax({
        type: 'GET',
        url: constants.GLOBALSYMBOLS_BASE_URL + "api/boardbuilder/v1/board_sets",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
    log.warn("found board sets: ", boardSets);

    if (deleteBoardSets) {
        for (let set of boardSets) {
            log.warn('delete', set.id);
            await $.ajax({
                type: 'DELETE',
                url: constants.GLOBALSYMBOLS_BASE_URL + 'api/boardbuilder/v1/board_sets/' + set.id,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        }
    }

    if (deleteImages) {
        let result = await $.ajax({
            type: 'DELETE',
            url: constants.GLOBALSYMBOLS_BASE_URL + '/api/boardbuilder/v1/media/delete_unreferenced',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        log.warn("deleted unreferenced images", result);
    }
}

export { oauthServiceGlobalSymbols };