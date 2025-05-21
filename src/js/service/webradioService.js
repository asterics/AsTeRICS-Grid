import $ from '../externals/jquery';
import { GridActionWebradio } from '../model/GridActionWebradio';
import { dataService } from './data/dataService';
import { localStorageService } from './data/localStorageService';
import { MainVue } from '../vue/mainVue';
import { i18nService } from './i18nService';
import { constants } from '../util/constants';
import { webAudioUtil } from '../util/webAudioUtil';

let WEBRADIO_LAST_PLAYED_ID_KEY = 'WEBRADIO_LAST_PLAYED_ID_KEY';
let API_URL = 'https://de1.api.radio-browser.info/json/';
let API_ACTION_SEARCH = 'stations/search';
let API_ACTION_GETURL = 'url';
let API_ACTION_STATIONS_UUID = 'stations/byuuid';
let searchParameters = ['name', 'country', 'state', 'language', 'tag', 'tagList', 'order'];
let standardSearchParameter = 'name';

let webradioService = {};
let lastPlayedId = localStorageService.get(WEBRADIO_LAST_PLAYED_ID_KEY);
let volume = localStorageService.getJSON(constants.WEBRADIO_LAST_VOLUME_KEY) || 1.0;
let hasMoreSearchResults = false;

webradioService.doAction = function (gridId, action) {
    switch (action.action) {
        case GridActionWebradio.WEBRADIO_ACTION_VOLUP:
            webradioService.volumeUp();
            return;
        case GridActionWebradio.WEBRADIO_ACTION_VOLDOWN:
            webradioService.volumeDown();
            return;
    }
    dataService.getGrid(gridId).then((grid) => {
        let radios = grid.webRadios || [];
        let radioId = action.radioId || lastPlayedId;
        let webradio = radios.filter((radio) => radioId === radio.radioId)[0] || radios[0];
        let index = 0;
        if (!webradio) {
            log.info('no radio station to play found.');
            return;
        }

        switch (action.action) {
            case GridActionWebradio.WEBRADIO_ACTION_START:
                fillUrl(webradio, gridId).then((webradioWithUrl) => {
                    webradioService.play(webradioWithUrl);
                });
                break;
            case GridActionWebradio.WEBRADIO_ACTION_TOGGLE:
                fillUrl(webradio, gridId).then((webradioWithUrl) => {
                    webradioService.toggle(webradioWithUrl);
                });
                break;
            case GridActionWebradio.WEBRADIO_ACTION_STOP:
                webradioService.stop();
                break;
            case GridActionWebradio.WEBRADIO_ACTION_NEXT:
                index = radios.map((e) => e.radioId).indexOf(webradio.radioId);
                if (index < 0 || radios.length < 2) {
                    return;
                }
                index = index + 1 < radios.length ? index + 1 : 0;
                fillUrl(radios[index], gridId).then((webradioWithUrl) => {
                    webradioService.play(webradioWithUrl);
                });
                break;
            case GridActionWebradio.WEBRADIO_ACTION_PREV:
                index = radios.map((e) => e.radioId).indexOf(webradio.radioId);
                if (index < 0 || radios.length < 2) {
                    return;
                }
                index = index - 1 >= 0 ? index - 1 : radios.length - 1;
                fillUrl(radios[index], gridId).then((webradioWithUrl) => {
                    webradioService.play(webradioWithUrl);
                });
                break;
        }
    });
};

webradioService.play = async function(webradio) {
    if (!webradio || (webAudioUtil.isPlaying() && lastPlayedId === webradio.radioId)) {
        return;
    }
    if (webAudioUtil.isPlaying()) {
        webAudioUtil.pause();
    }
    lastPlayedId = webradio.radioId || lastPlayedId;
    localStorageService.save(WEBRADIO_LAST_PLAYED_ID_KEY, lastPlayedId);
    let radioWithUrl = await fillUrl(webradio);
    log.debug('playing: ' + radioWithUrl.radioUrl);
    try {
        await webAudioUtil.playUrl(radioWithUrl.radioUrl);
        webAudioUtil.setVolume(volume);
        let tooltipText = i18nService.t('playingWebradio', radioWithUrl.radioName);
        MainVue.setTooltip(tooltipText, {
            closeOnNavigate: false,
            actionLink: i18nService.t('stop'),
            actionLinkFn: webradioService.stop,
            imageUrl: radioWithUrl.faviconUrl
        });
    } catch (e) {
        let error = e + '';
        if (error.includes('NotAllowedError')) {
            MainVue.setTooltip(i18nService.t('couldntPlayWebradioBecauseTheBrowserDidntAllow'), {
                msgType: 'warn',
                actionLink: i18nService.t('allowPlayingRadio'),
                actionLinkFn: () => {
                    webradioService.play(webradio);
                }
            });
        } else if (lastPlayedId === webradio.radioId) {
            showErrorMsg(webradio);
        }
    }
};

webradioService.stop = function (radioId) {
    if (!radioId || radioId === lastPlayedId) {
        webAudioUtil.pause();
        MainVue.clearTooltip();
    }
};

/**
 * toggles play/pause of the given webradio
 * @param webradio
 * @return the given webradio config if it's now playing, otherwise null
 */
webradioService.toggle = function (webradio) {
    if (!webAudioUtil.isPlaying()) {
        webradioService.play(webradio);
        return webradio;
    } else {
        webradioService.stop();
        return null;
    }
};

webradioService.volumeUp = function () {
    volume = webAudioUtil.volumeUp('webradioVolume');
    localStorageService.saveJSON(constants.WEBRADIO_LAST_VOLUME_KEY, volume);
};

webradioService.volumeDown = function () {
    volume = webAudioUtil.volumeDown('webradioVolume');
    localStorageService.saveJSON(constants.WEBRADIO_LAST_VOLUME_KEY, volume);
};

/**
 * searches for radios by search string.
 *
 * @param searchString normally searches for radio stations by name, if some special tag with a colon is included,
 * search can be done for other properties. E.g. "tag:jazz country:austria" searches for jazz radio stations in Austria.
 * @param limit the maximum of elements to be returned
 * @param offset the offset of returned elements (for paging)
 * @return {Promise<unknown>|Promise<Array>}
 *         promise resolves to a list of Webradios (see Webradio data model) where radioUrl is NOT set (has to be
 *         retrieved by separate API call)
 */
webradioService.search = function (searchString, limit, offset) {
    if (!searchString) {
        return Promise.resolve([]);
    }
    let params = {};
    let paramPositions = [];
    searchParameters.forEach((parameter) => {
        let index = searchString.indexOf(parameter + ':');
        if (index > -1) {
            paramPositions.push({
                param: parameter,
                position: index
            });
        }
    });
    paramPositions.sort((a, b) => a.position - b.position);
    paramPositions.forEach((paramPosition, index, array) => {
        let next = array[index + 1];
        let nextPos = next ? next.position - 1 : undefined;
        let finalParam = searchString.substring(paramPosition.position + paramPosition.param.length + 1, nextPos);
        finalParam = finalParam.replace(/(^")|("$)/g, '');
        params[paramPosition.param] = finalParam;
    });
    if (Object.keys(params).length === 0) {
        params[standardSearchParameter] = searchString;
    }
    let limitToUse = limit || 20;
    limitToUse++;
    params['limit'] = limitToUse;
    if (offset) {
        params['offset'] = offset;
    }

    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: API_URL + API_ACTION_SEARCH,
            data: params,
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        }).then(
            (data) => {
                hasMoreSearchResults = data.length === limitToUse;
                let workingRadios = data.filter((radio) => radio.lastcheckok !== '0');
                workingRadios = workingRadios.slice(0, limitToUse - 1);
                resolve(
                    workingRadios.map((el) => {
                        return {
                            radioId: el.stationuuid,
                            radioUUID: el.stationuuid,
                            radioName: el.name,
                            faviconUrl: el.favicon
                        };
                    })
                );
            },
            (error) => {
                reject(error);
            }
        );
    });
};

/**
 * returns true if the last call to webradioService.search() could have retrieved more elements if called with a higher
 * limit
 */
webradioService.hasMoreSearchResults = function () {
    return hasMoreSearchResults;
};

function showErrorMsg(webradio) {
    MainVue.setTooltip(i18nService.t('errorPlayingWebradio', webradio.radioName), {
        msgType: 'warn'
    });
}

function fillUrl(webradio, gridId) {
    return new Promise((resolve, reject) => {
        if (webradio.radioUrl) {
            return resolve(webradio);
        }
        $.ajax({
            type: 'GET',
            url: API_URL + API_ACTION_GETURL + '/' + webradio.radioId,
            dataType: 'json'
        });

        $.ajax({
            type: 'GET',
            url: API_URL + API_ACTION_STATIONS_UUID + '/' + webradio.radioId,
            dataType: 'json'
        }).then((list) => {
            let data = list[0];
            webradio.radioUrl = data.url_resolved || data.url;
            if (webradio.radioUrl.lastIndexOf('/') === webradio.radioUrl.length - 1) {
                webradio.radioUrl = webradio.radioUrl + ';';
            }
            let lastcolon = webradio.radioUrl.lastIndexOf(':');
            if (lastcolon > -1) {
                let port = webradio.radioUrl.substring(lastcolon + 1);
                if (parseInt(port) + '' === port) {
                    //url ends with a port, e.g. :8000
                    webradio.radioUrl = webradio.radioUrl + '/;';
                }
            }
            if (gridId) {
                dataService.getGrid(gridId).then((grid) => {
                    let radios = grid.webRadios || [];
                    let savedRadio = radios.filter((radio) => webradio.radioId === radio.radioId)[0];
                    if (savedRadio) {
                        savedRadio.radioUrl = webradio.radioUrl;
                        dataService.saveGrid(grid);
                    }
                });
            }
            resolve(webradio);
        });
    });
}

export { webradioService };
