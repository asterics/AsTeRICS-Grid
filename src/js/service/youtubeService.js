import $ from 'jquery';
import {GridActionYoutube} from "../model/GridActionYoutube";
import {constants} from "../util/constants";
import {localStorageService} from "./data/localStorageService";

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
    lastPlayType: null,
    lastData: null,
    lastTimes: {}, // Video ID -> Player Time
    lastPlaylistIndexes: {}, // Playlist ID -> last played video index
};

let initialized = false;
let player = null;
let playerID = 'player';
let ytState = localStorageService.getYTState() || initYtState;
let waitForBuffering = false;
let navigateAction = null;

youtubeService.doAction = function (action) {
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
    }
};

youtubeService.play = function (action, videoTime) {
    let promise = Promise.resolve();
    if (!initialized) {
        promise = init();
    }
    promise.then(() => {
        if (!player) {
            player = new YT.Player(playerID, {
                height: $(".yt-container")[0].getBoundingClientRect().height,
                width: $(".yt-container")[0].getBoundingClientRect().width,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': (event) => {
                        if (waitForBuffering && event.data === PLAYER_STATES.BUFFERING) {
                            waitForBuffering = false;
                            onBuffering();
                        }
                    }
                }
            });
        } else {
            processAction();
        }

        function onPlayerReady(event) {
            processAction();
        }

        function processAction() {
            if (!action.data) {
                action.playType = ytState.lastPlayType;
                action.data = ytState.lastData;
            }
            ytState.lastPlayType = action.playType;
            ytState.lastData = action.data;
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

youtubeService.setActionAfterNavigate = function (action) {
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
        ytState = initYtState;
    }
    localStorageService.saveYTState(ytState);
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

    window.addEventListener('beforeunload', (event) => {
        saveState();
    });

    return new Promise(resolve => {
        //see https://developers.google.com/youtube/iframe_api_reference#Getting_Started
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        window.onYouTubeIframeAPIReady = function () {
            initialized = true;
            resolve();
        }
    });
}

$(document).on(constants.EVENT_GRID_LOADED, () => {
    if (navigateAction) {
        youtubeService.doAction(navigateAction);
        navigateAction = null;
    }
});

export {youtubeService};