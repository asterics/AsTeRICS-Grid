import {$} from '../externals/jquery';
import {GridActionWebradio} from "../model/GridActionWebradio";
import {dataService} from "./data/dataService";
import {localStorageService} from "./data/localStorageService";
import {MainVue} from "../vue/mainVue";
import {i18nService} from "./i18nService";

let WEBRADIO_LAST_PLAYED_ID_KEY = 'WEBRADIO_LAST_PLAYED_ID_KEY';
let WEBRADIO_LAST_VOLUME_KEY = 'WEBRADIO_LAST_VOLUME_KEY';
let API_URL = 'https://de1.api.radio-browser.info/json/';
let API_ACTION_SEARCH = 'stations/search';
let API_ACTION_GETURL = 'url';
let API_ACTION_STATIONS_UUID = 'stations/byuuid';
let VOLUME_STEP = 0.15;
let searchParameters = ['name', 'country', 'state', 'language', 'tag', 'tagList', 'order'];
let standardSearchParameter = 'name';

let webradioService = {};
let player = document.getElementById('audioPlayer');
let videoPlayer = document.getElementById('videoPlayer');
let lastPlayedId = localStorageService.get(WEBRADIO_LAST_PLAYED_ID_KEY);
let volume = parseFloat(localStorageService.get(WEBRADIO_LAST_VOLUME_KEY) || 1.0);
let hasMoreSearchResults = false;
let playingVideo = false;

webradioService.doAction = function (gridId, action) {
    dataService.getGrid(gridId).then(grid => {
        let radios = grid.webRadios || [];
        let radioId = action.radioId || lastPlayedId;
        let webradio = radios.filter(radio => radioId === radio.radioId)[0] || radios[0];
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
                index = radios.map(e => e.radioId).indexOf(webradio.radioId);
                if (index < 0 || radios.length < 2) {
                    return;
                }
                index = index + 1 < radios.length ? index + 1 : 0;
                fillUrl(radios[index], gridId).then((webradioWithUrl) => {
                    webradioService.play(webradioWithUrl);
                });
                break;
            case GridActionWebradio.WEBRADIO_ACTION_PREV:
                index = radios.map(e => e.radioId).indexOf(webradio.radioId);
                if (index < 0 || radios.length < 2) {
                    return;
                }
                index = index - 1 >= 0 ? index - 1 : radios.length - 1;
                fillUrl(radios[index], gridId).then((webradioWithUrl) => {
                    webradioService.play(webradioWithUrl);
                });
                break;
            case GridActionWebradio.WEBRADIO_ACTION_VOLUP:
                webradioService.volumeUp();
                break;
            case GridActionWebradio.WEBRADIO_ACTION_VOLDOWN:
                webradioService.volumeDown();
                break;
        }
    });
};

webradioService.play = function (webradio) {
    if (!webradio || (!player.paused && lastPlayedId === webradio.radioId)) {
        return;
    }
    if (!player.paused || !videoPlayer.paused) {
        webradioService.stop();
    }
    lastPlayedId = webradio.radioId || lastPlayedId;
    localStorageService.save(WEBRADIO_LAST_PLAYED_ID_KEY, lastPlayedId);
    fillUrl(webradio).then(radioWithUrl => {
        log.debug('playing: ' + radioWithUrl.radioUrl);
        let promise = Promise.resolve();
        if (webradio.radioUrl.indexOf('.m3u8') !== -1) {
            playingVideo = true;
            videoPlayer.src = radioWithUrl.radioUrl;
            import(/* webpackChunkName: "hls.js" */ 'hls.js').then(Hls => {
                Hls = Hls.default;
                if (Hls.isSupported()) {
                    let hls = new Hls();
                    hls.loadSource(radioWithUrl.radioUrl);
                    hls.attachMedia(videoPlayer);
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        videoPlayer.play();
                    });
                }
            });
        } else {
            playingVideo = false;
            player.src = radioWithUrl.radioUrl;
            player.volume = volume;
            promise = player.play();
        }
        let tooltipText = i18nService.translate('playing: {?} // Wiedergabe: {?}', radioWithUrl.radioName);
        MainVue.setTooltip(tooltipText, {
            closeOnNavigate: false,
            actionLink: i18nService.translate('Stop // Stopp'),
            actionLinkFn: webradioService.stop,
            imageUrl: radioWithUrl.faviconUrl
        });
        if (promise && promise.then) { //IE does not return promise on play
            promise.catch(() => {
                if (lastPlayedId === webradio.radioId) {
                    showErrorMsg(webradio);
                }
            });
        }
    });
};

webradioService.stop = function (radioId) {
    if (!radioId || radioId === lastPlayedId) {
        player.pause();
        videoPlayer.pause();
        MainVue.clearTooltip();
    }
};

webradioService.toggle = function (webradio) {
    if (!playingVideo && player.paused || playingVideo && videoPlayer.paused) {
        webradioService.play(webradio);
    } else {
        webradioService.stop();
    }
};

webradioService.volumeUp = function () {
    volume = volume + VOLUME_STEP <= 1.0 ? volume + VOLUME_STEP : 1;
    volume = Math.round(volume * 100) / 100;
    localStorageService.save(WEBRADIO_LAST_VOLUME_KEY, volume);
    setVolumeTooltip();
    player.volume = volume;
    videoPlayer.volume = volume;
};

webradioService.volumeDown = function () {
    volume = volume - VOLUME_STEP >= 0 ? volume - VOLUME_STEP : 0;
    volume = Math.round(volume * 100) / 100;
    localStorageService.save(WEBRADIO_LAST_VOLUME_KEY, volume);
    setVolumeTooltip();
    player.volume = volume;
    videoPlayer.volume = volume;
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
    searchParameters.forEach(parameter => {
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
            type: "POST",
            url: API_URL + API_ACTION_SEARCH,
            data: params,
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        }).then(data => {
            hasMoreSearchResults = data.length === limitToUse;
            let workingRadios = data.filter(radio => radio.lastcheckok !== '0');
            workingRadios = workingRadios.slice(0, limitToUse - 1);
            resolve(workingRadios.map(el => {
                return {
                    radioId: el.stationuuid,
                    radioUUID: el.stationuuid,
                    radioName: el.name,
                    faviconUrl: el.favicon
                };
            }));
        }, error => {
            reject(error);
        });
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
    MainVue.setTooltip(i18nService.translate('Error playing: {?}, no internet?! // Fehler bei Wiedergabe: {?}, kein Internet?!', webradio.radioName), {
        msgType: 'warn'
    });
}

function setVolumeTooltip() {
    MainVue.setTooltip(i18nService.translate('Volume: {?} / 100 // Lautstärke: {?} / 100', Math.round(volume * 100)), {
        revertOnClose: true,
        timeout: 5000
    });
}

function fillUrl(webradio, gridId) {
    return new Promise((resolve, reject) => {
        if (webradio.radioUrl) {
            return resolve(webradio);
        }
        $.ajax({
            type: "GET",
            url: API_URL + API_ACTION_GETURL + '/' + webradio.radioId,
            dataType: 'json'
        });

        $.ajax({
            type: "GET",
            url: API_URL + API_ACTION_STATIONS_UUID + '/' + webradio.radioId,
            dataType: 'json'
        }).then(list => {
            let data = list[0];
            webradio.radioUrl = data.url_resolved || data.url;
            if (webradio.radioUrl.lastIndexOf('/') === webradio.radioUrl.length - 1) {
                webradio.radioUrl = webradio.radioUrl + ';';
            }
            let lastcolon = webradio.radioUrl.lastIndexOf(':');
            if (lastcolon > -1) {
                let port = webradio.radioUrl.substring(lastcolon + 1);
                if (parseInt(port) + '' === port) { //url ends with a port, e.g. :8000
                    webradio.radioUrl = webradio.radioUrl + '/;';
                }
            }
            if (gridId) {
                dataService.getGrid(gridId).then(grid => {
                    let radios = grid.webRadios || [];
                    let savedRadio = radios.filter(radio => webradio.radioId === radio.radioId)[0];
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

export {webradioService};