import {$} from '../externals/jquery';
import {GridActionWebradio} from "../model/GridActionWebradio";
import {dataService} from "./data/dataService";
import {localStorageService} from "./data/localStorageService";

let WEBRADIO_LAST_PLAYED_ID_KEY = 'WEBRADIO_LAST_PLAYED_ID_KEY';
let WEBRADIO_LAST_VOLUME_KEY = 'WEBRADIO_LAST_VOLUME_KEY';
let API_URL = 'http://www.radio-browser.info/webservice/json/';
let API_ACTION_SEARCH = 'stations/search';
let API_ACTION_GETURL = 'url';
let VOLUME_STEP = 0.15;
let searchParameters = ['name', 'country', 'state', 'language', 'tag', 'tagList', 'order'];
let standardSearchParameter = 'name';

let webradioService = {};
let player = document.getElementById('audioPlayer');
let lastPlayedId = localStorageService.get(WEBRADIO_LAST_PLAYED_ID_KEY);
let volume = parseFloat(localStorageService.get(WEBRADIO_LAST_VOLUME_KEY) || 1.0);

webradioService.doAction = function (gridId, action) {
    dataService.getGrid(gridId).then(grid => {
        let radios = grid.webRadios || [];
        let radioId = action.radioId || lastPlayedId;
        let webradio = radios.filter(radio => radioId === radio.radioId)[0] || radios[0];
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
            case GridActionWebradio.WEBRADIO_ACTION_STOP:
                webradioService.stop();
                break;
            case GridActionWebradio.WEBRADIO_ACTION_NEXT:
                let index = radios.map(e => e.radioId).indexOf(webradio.radioId);
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
    if (!player.paused) {
        player.pause();
    }
    lastPlayedId = webradio.radioId || lastPlayedId;
    localStorageService.save(WEBRADIO_LAST_PLAYED_ID_KEY, lastPlayedId);
    fillUrl(webradio).then(radioWithUrl => {
        log.info('play: ' + radioWithUrl.radioName);
        player.src = radioWithUrl.radioUrl;
        player.volume = volume;
        player.play();
    });
};

webradioService.stop = function (radioId) {
    if (!radioId || radioId === lastPlayedId) {
        player.pause();
    }
};

webradioService.toggle = function (webradio) {
    if (player.paused) {
        webradioService.play(webradio);
    } else {
        webradioService.stop();
    }
};

webradioService.volumeUp = function () {
    volume = volume + VOLUME_STEP <= 1.0 ? volume + VOLUME_STEP : 1;
    volume = Math.round(volume * 100) / 100;
    localStorageService.save(WEBRADIO_LAST_VOLUME_KEY, volume);
    player.volume = volume;
};

webradioService.volumeDown = function () {
    volume = volume - VOLUME_STEP >= 0 ? volume - VOLUME_STEP : 0;
    volume = Math.round(volume * 100) / 100;
    localStorageService.save(WEBRADIO_LAST_VOLUME_KEY, volume);
    player.volume = volume;
};

/**
 * searches for radios by search string.
 *
 * @param searchString normally searches for radio stations by name, if some special tag with a colon is included,
 * search can be done for other properties. E.g. "tag:jazz country:austria" searches for jazz radio stations in Austria.
 * @return {Promise<unknown>|Promise<Array>}
 *         promise resolves to a list of Webradios (see Webradio data model) where radioUrl is NOT set (has to be
 *         retrieved by separate API call)
 */
webradioService.search = function (searchString) {
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
    params['limit'] = 20;

    return new Promise((resolve) => {
        $.ajax({
            type: "POST",
            url: API_URL + API_ACTION_SEARCH,
            data: params,
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        }).then(data => {
            let workingRadios = data.filter(radio => radio.lastcheckok !== '0');
            resolve(workingRadios.map(el => {
                return {
                    radioId: el.id,
                    radioUUID: el.stationuuid,
                    radioName: el.name,
                    faviconUrl: el.favicon
                };
            }));
        });
    });
};

function fillUrl(webradio, gridId) {
    return new Promise(resolve => {
        if (webradio.radioUrl) {
            return resolve(webradio);
        }
        $.ajax({
            type: "GET",
            url: API_URL + API_ACTION_GETURL + '/' + webradio.radioId,
            dataType: 'json'
        }).then(data => {
            process(data, webradio);
        }, (error) => {
            //  fix for issue: https://github.com/segler-alex/radiobrowser-api-rust/issues/13
            let nameOriginal = error.responseText.substring(error.responseText.indexOf('"name":') + 8, error.responseText.indexOf('"url":') - 2);
            let name = nameOriginal.replace(new RegExp('"', 'g'), "'");
            let string = error.responseText.replace(nameOriginal, name);
            process(JSON.parse(string), webradio);
        });

        function process(data, webradio) {
            webradio.radioUrl = data[0].url;
            if (webradio.radioUrl.lastIndexOf('/') === webradio.radioUrl.length - 1) {
                webradio.radioUrl = webradio.radioUrl + ';';
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
        }
    });
}

export {webradioService};