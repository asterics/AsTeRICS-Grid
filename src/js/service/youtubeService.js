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
}

let initialized = false;
let player = null;
let playerID = 'player';
let ytState = localStorageService.getYTState() || {
    lastVideoId: null,
    lastTimes: {} // ID -> Player Time
};

youtubeService.doAction = function (action) {
    switch (action.action) {
        case GridActionYoutube.actions.YT_PLAY:
            youtubeService.play(action.videoLink);
            break;
        case GridActionYoutube.actions.YT_PAUSE:
            youtubeService.pause();
            break;
        case GridActionYoutube.actions.YT_TOGGLE:
            youtubeService.toggle(action.videoLink);
            break;
        case GridActionYoutube.actions.YT_RESTART:
            youtubeService.restart(action.videoLink);
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
    }
};

youtubeService.play = function (videoLink) {
    let promise = Promise.resolve();
    if (!initialized) {
        promise = init();
    }
    promise.then(() => {
        let videoId = youtubeService.getVideoId(videoLink) || ytState.lastVideoId;
        if (!videoId) {
            return;
        }
        if (ytState.lastVideoId === videoId && player) {
            player.playVideo();
            return;
        }
        ytState.lastVideoId = videoId;
        localStorageService.saveYTState(ytState);
        player = new YT.Player(playerID, {
            height: $(".yt-container")[0].getBoundingClientRect().height,
            width: $(".yt-container")[0].getBoundingClientRect().width,
            videoId: videoId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': () => {}
            }
        });

        function onPlayerReady(event) {
            let lastTime = ytState.lastTimes[videoId];
            if (lastTime) {
                player.seekTo(lastTime);
            }
            player.playVideo();
        }
    });
}

youtubeService.pause = function () {
    if (player) {
        player.pauseVideo();
        saveTiming();
    }
}

youtubeService.stop = function () {
    if (player) {
        player.seekTo(0);
        youtubeService.pause();
    }
}

youtubeService.toggle = function (videoLink) {
    if (!youtubeService.isPlaying()) {
        youtubeService.play(videoLink);
    } else {
        youtubeService.pause();
    }
}

youtubeService.restart = function (videoLink) {
    if (player) {
        player.seekTo(0);
    }
    saveTiming();
    youtubeService.play(videoLink);
}

youtubeService.seekToRelative = function (offset) {
    if (player) {
        player.seekTo(player.getCurrentTime() + offset);
        saveTiming();
    }
}

youtubeService.isPlaying = function () {
    return player && player.getPlayerState() === PLAYER_STATES.PLAYING;
}


youtubeService.getVideoId = function (videoLink) {
    if (!videoLink) {
        return null;
    }
    let url = null;
    try {
        url = new URL(videoLink);
    } catch (e) {
    }
    let vParam = url ? url.searchParams.get("v") : null;
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

youtubeService.destroy = function () {
    if (player) {
        saveTiming();
        player.destroy();
    }
    player = null;
}

function saveTiming() {
    if (player) {
        ytState.lastTimes[ytState.lastVideoId] = player.getCurrentTime();
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
        saveTiming();
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

export {youtubeService};