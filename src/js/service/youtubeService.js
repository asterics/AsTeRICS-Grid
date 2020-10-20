import $ from 'jquery';
import {GridActionYoutube} from "../model/GridActionYoutube";
import {constants} from "../util/constants";
import {localStorageService} from "./data/localStorageService";
import {inputEventHandler} from "../input/inputEventHandler";
import {MainVue} from "../vue/mainVue";
import {i18nService} from "./i18nService";

let youtubeService = {};

let PLAYER_STATES = {
    BUFFERING: 3,
    CUED: 5,
    ENDED: 0,
    PAUSED: 2,
    PLAYING: 1,
    UNSTARTED: -1
};
let initYtState = {
    lastPlayType: GridActionYoutube.playTypes.YT_PLAY_PLAYLIST,
    lastData: 'https://www.youtube.com/watch?v=5ffLB4a9APc&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz',
    lastTimes: {}, // Video ID -> Player Time
    lastPlaylistIndexes: {}, // Playlist ID -> last played video index
    muted: false,
    volume: 100
};

let initialized = false;
let player = null;
let playerID = 'player';
let ytState = localStorageService.getYTState() || JSON.parse(JSON.stringify(initYtState));
let waitForBuffering = false;
let navigateAction = null;
let iframe = null;
let tooltipID = null;

youtubeService.doAction = function (action) {
    if (action.performAfterNav) {
        youtubeService.setActionAfterNavigate(action);
        return;
    }
    switch (action.action) {
        case GridActionYoutube.actions.YT_PLAY:
            youtubeService.play(action);
            break;
        case GridActionYoutube.actions.YT_PAUSE:
            youtubeService.pause();
            break;
        case GridActionYoutube.actions.YT_TOGGLE:
            youtubeService.toggle(action);
            break;
        case GridActionYoutube.actions.YT_RESTART:
            youtubeService.restart(action);
            break;
        case GridActionYoutube.actions.YT_STOP:
            youtubeService.stop();
            break;
        case GridActionYoutube.actions.YT_STEP_FORWARD:
            youtubeService.seekToRelative(action.stepSeconds);
            break;
        case GridActionYoutube.actions.YT_STEP_BACKWARD:
            youtubeService.seekToRelative(-action.stepSeconds);
            break;
        case GridActionYoutube.actions.YT_NEXT_VIDEO:
            youtubeService.nextVideo();
            break;
        case GridActionYoutube.actions.YT_PREV_VIDEO:
            youtubeService.previousVideo();
            break;
        case GridActionYoutube.actions.YT_ENTER_FULLSCREEN:
            youtubeService.enterFullscreen();
            break;
        case GridActionYoutube.actions.YT_VOLUME_UP:
            youtubeService.volumeUp(action.stepVolume);
            break;
        case GridActionYoutube.actions.YT_VOLUME_DOWN:
            youtubeService.volumeDown(action.stepVolume);
            break;
        case GridActionYoutube.actions.YT_VOLUME_MUTE:
            youtubeService.volumeToggleMute();
            break;
    }
};

youtubeService.play = function (action, videoTime) {
    let promise = Promise.resolve();
    MainVue.clearTooltip(tooltipID);
    if (!initialized) {
        promise = init();
    }
    promise.then(() => {
        if (!action.data) {
            action.playType = ytState.lastPlayType;
            action.data = ytState.lastData;
        }
        ytState.lastPlayType = action.playType;
        ytState.lastData = action.data;
        if (!player) {
            player = new YT.Player(playerID, {
                height: $(".yt-container")[0].getBoundingClientRect().height,
                width: $(".yt-container")[0].getBoundingClientRect().width,
                playerVars: {
                    'mute': action.playMuted ? 1 : 0,
                    'cc_load_policy': action.showCC ? 1 : 0,
                    'cc_lang_pref': i18nService.getBrowserLang(),
                    'rel': 0,
                    'iv_load_policy': 3
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': (event) => {
                        if (waitForBuffering && event.data === PLAYER_STATES.BUFFERING) {
                            waitForBuffering = false;
                            onBuffering();
                        }
                    },
                    'onError' : () => {
                        log.warn('error on playing YouTube video');
                        errorMessage();
                    }
                }
            });
        } else {
            processAction();
        }

        function onPlayerReady(event) {
            iframe = $('#' + playerID)[0];
            youtubeService.setVolume(ytState.volume, true);
            if (ytState.muted) {
                player.mute();
            }
            processAction();
        }

        function processAction() {
            switch (action.playType) {
                case GridActionYoutube.playTypes.YT_PLAY_VIDEO:
                    let videoId = youtubeService.getVideoId(action.data);
                    if (!videoId) {
                        return;
                    }
                    if (videoId === youtubeService.getVideoId(player.getVideoUrl())) {
                        player.playVideo();
                        return;
                    }
                    let lastTime = ytState.lastTimes[videoId];
                    player.loadVideoById(videoId, videoTime !== undefined ? videoTime : lastTime);
                    break;
                case GridActionYoutube.playTypes.YT_PLAY_SEARCH:
                    waitForBuffering = true;
                    player.loadPlaylist({
                        list: action.data,
                        listType: 'search',
                        index: ytState.lastPlaylistIndexes[action.data]
                    });
                    break;
                case GridActionYoutube.playTypes.YT_PLAY_PLAYLIST:
                    let playlistId = youtubeService.getPlaylistId(action.data);
                    waitForBuffering = true;
                    player.loadPlaylist({
                        list: playlistId,
                        listType: 'playlist',
                        index: ytState.lastPlaylistIndexes[action.data]
                    });
                    break;
                case GridActionYoutube.playTypes.YT_PLAY_CHANNEL:
                    let channel = youtubeService.getChannelId(action.data);
                    let channelPlaylist = youtubeService.getChannelPlaylist(channel);
                    waitForBuffering = true;
                    log.warn(ytState.lastPlaylistIndexes[action.data]);
                    player.loadPlaylist({
                        list: channelPlaylist,
                        listType: 'playlist',
                        index: ytState.lastPlaylistIndexes[action.data]
                    });
                    break;
            }
            saveState();
        }

        function onBuffering() {
            player.setLoop(true);
            let lastTime = ytState.lastTimes[youtubeService.getCurrentVideoId()];
            if (videoTime || lastTime) {
                player.seekTo(videoTime !== undefined ? videoTime : lastTime);
            }
        }
    });
}

youtubeService.pause = function () {
    if (player) {
        player.pauseVideo();
        saveState();
    }
}

youtubeService.stop = function () {
    if (player) {
        player.seekTo(0);
        youtubeService.pause();
    }
}

youtubeService.toggle = function (action) {
    if (youtubeService.isPaused()) {
        player.playVideo();
    } else if (!youtubeService.isPlaying()) {
        youtubeService.play(action);
    } else {
        youtubeService.pause();
    }
}

youtubeService.restart = function (action) {
    if (player) {
        player.seekTo(0);
    }
    saveState();
    if (youtubeService.isPaused()) {
        player.playVideo();
    } else if (!youtubeService.isPlaying()) {
        youtubeService.play(action, 0);
    }
}

youtubeService.nextVideo = function () {
    if (player) {
        player.nextVideo();
    }
}

youtubeService.previousVideo = function () {
    if (player) {
        player.previousVideo();
    }
}

youtubeService.seekToRelative = function (offset) {
    if (player) {
        player.seekTo(player.getCurrentTime() + offset);
        saveState();
    }
}

youtubeService.enterFullscreen = function () {
    if (player && iframe) {
        let requestFullScreen = iframe.requestFullScreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullScreen || iframe.msRequestFullscreen;
        if (requestFullScreen) {
            requestFullScreen.bind(iframe)();
            inputEventHandler.global.onAnyKey(youtubeService.exitFullscreen);
        }
    }
}

youtubeService.exitFullscreen = function () {
    let exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exitFullscreen) {
        exitFullscreen.bind(document)();
    }
    inputEventHandler.global.off(youtubeService.exitFullscreen);
}

youtubeService.volumeUp = function (diffPercentage) {
    youtubeService.setVolume(Math.min(player.getVolume() + diffPercentage, 100));
}

youtubeService.volumeDown = function (diffPercentage) {
    youtubeService.setVolume(Math.max(player.getVolume() - diffPercentage, 0));
}

youtubeService.setVolume = function (volume, initSet) {
    if (player) {
        player.setVolume(volume);
        if (!initSet) {
            if (player.isMuted) {
                player.unMute();
                ytState.muted = false;
            }
            MainVue.setTooltip(i18nService.translate('Volume: {?} / 100 // Lautstärke: {?} / 100', volume), {
                revertOnClose: true,
                timeout: 5000
            });
            ytState.volume = volume;
            saveState();
        }
    }
}

youtubeService.volumeToggleMute = function () {
    if (player) {
        let isMuted = player.isMuted();
        isMuted ? player.unMute() : player.mute();
        ytState.muted = !isMuted;
        saveState();
    }
}

youtubeService.setActionAfterNavigate = function (action) {
    action.performAfterNav = false;
    navigateAction = action;
}

youtubeService.isPlaying = function () {
    return player && player.getPlayerState() === PLAYER_STATES.PLAYING;
}

youtubeService.isPaused = function () {
    return player && player.getPlayerState() === PLAYER_STATES.PAUSED;
}

youtubeService.getCurrentVideoId = function () {
    if (player) {
        return youtubeService.getVideoId(player.getVideoUrl());
    }
    return "";
}

youtubeService.getVideoId = function (videoLink) {
    if (!videoLink) {
        return null;
    }
    let vParam = getURLParam(videoLink, 'v');
    let shortUrlPrefix = 'youtu.be/';
    if (vParam) {
        return vParam;
    } else if (videoLink.indexOf(shortUrlPrefix) !== -1) {
        let startIndex = videoLink.indexOf(shortUrlPrefix) + shortUrlPrefix.length;
        let endIndex = videoLink.indexOf('?') !== -1 ? videoLink.indexOf('?') : undefined;
        return videoLink.substring(startIndex, endIndex);
    }
    return videoLink;
}

youtubeService.getPlaylistId = function (videoLink) {
    if (!videoLink) {
        return null;
    }
    let listParam = getURLParam(videoLink, 'list');
    return listParam ? listParam : videoLink;
}

youtubeService.getChannelId = function (link) {
    if (!link) {
        return null;
    }
    let channelPrefixes = ['channel/'];
    for (let i = 0; i < channelPrefixes.length; i++) {
        if (link.indexOf(channelPrefixes[i]) !== -1) {
            let start = link.indexOf(channelPrefixes[i]) + channelPrefixes[i].length;
            let channel = link.substring(start);
            channel = channel.indexOf('/') === -1 ? channel : channel.substring(0, channel.indexOf('/'));
            if (channel) {
                return channel;
            }
        }
    }
    return link;
}

youtubeService.getChannelPlaylist = function (channelId) {
    if (channelId.indexOf('UC') === 0) {
        channelId = channelId.replace('UC', 'UU');
    }
    return channelId;
};

youtubeService.destroy = function () {
    if (player) {
        saveState();
        player.destroy();
    }
    player = null;
}

function getURLParam(urlString, paramName) {
    let url = null;
    try {
        url = new URL(urlString);
    } catch (e) {
    }
    return url ? url.searchParams.get(paramName) : null;

}

function saveState() {
    if (player) {
        let videoId = youtubeService.getCurrentVideoId();
        let currentIndex = player.getPlaylistIndex();
        if (videoId) {
            ytState.lastTimes[videoId] = player.getCurrentTime();
        }
        if (currentIndex >= 0 && ytState.lastPlayType !== GridActionYoutube.playTypes.YT_PLAY_VIDEO) {
            ytState.lastPlaylistIndexes[ytState.lastData] = currentIndex;
        }
    }
    if (JSON.stringify(ytState).length > 1024 * 1024) { // bigger than 1 MB -> reset
        ytState.lastPlaylistIndexes = {};
        ytState.lastTimes = {};
    }
    localStorageService.saveYTState(ytState);
}

function errorMessage() {
    tooltipID = MainVue.setTooltip(i18nService.translate('Error on playing YouTube video. Please check internet connection. // Fehler bei der Wiedergabe des YouTube Videos. Bitte Internet-Verbindung überprüfen.'), {
        timeout: 30000,
        msgType: 'warn'
    });
}

function init() {
    if (initialized) {
        return Promise.resolve();
    }

    $(document).on(constants.EVENT_GRID_RESIZE, () => {
        if (player) {
            setTimeout(() => {
                let rect = $(".yt-container")[0].getBoundingClientRect();
                player.setSize(rect.width, rect.height);
            }, 400);
        }
    });

    $(document).on(constants.EVENT_USER_CHANGED, () => {
        ytState = localStorageService.getYTState() || JSON.parse(JSON.stringify(initYtState));;
    });

    window.addEventListener('beforeunload', (event) => {
        saveState();
    });

    return new Promise(resolve => {
        //see https://developers.google.com/youtube/iframe_api_reference#Getting_Started
        let tag = document.createElement('script');

        tag.onerror = function (e) {
            log.warn('error on loading YouTube API script');
            errorMessage();
        }

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        window.onYouTubeIframeAPIReady = function () {
            initialized = true;
            resolve();
        }

        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
}

$(document).on(constants.EVENT_GRID_LOADED, () => {
    if (navigateAction) {
        youtubeService.doAction(navigateAction);
        navigateAction = null;
    }
});

export {youtubeService};