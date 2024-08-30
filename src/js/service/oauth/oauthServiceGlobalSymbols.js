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

oauthServiceGlobalSymbols.getUsername = async function() {
    if (!oauthServiceGlobalSymbols.isLoggedIn()) {
        return '';
    }
    let user = await oauthService.getUser(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
    return user && user.profile ? user.profile.name : '';
}

oauthServiceGlobalSymbols.exportGrids = async function(gridIds, metadata = {
    name: '',
    description: '',
    tags: [],
    lang: '',
    author: '',
    author_url: '',
    self_contained: false,
    public: true,
    thumbnail: '',
}) {
    if (!oauthServiceGlobalSymbols.isLoggedIn()) {
        return;
    }
    let backupData = await dataService.getBackupData(gridIds, {
        obzFileMap: true
    });
    let accessToken = await oauthService.getAccessToken(constants.OAUTH_CONFIG_GLOBALSYMBOLS);
    let sendData = {
        obz_file_map: JSON.stringify(backupData),
        lang: i18nService.getContentLang(),
        self_contained: metadata.self_contained || false,
        public: metadata.public === true,
    }
    for (let key of Object.keys(metadata)) {
        sendData[key] = metadata[key] || sendData[key];
    }
    let result = await $.ajax({
        type: 'POST',
        url: `${constants.GLOBALSYMBOLS_BASE_URL}api/boardbuilder/v1/board_sets/obz`,
        data: sendData,
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
}

export { oauthServiceGlobalSymbols };