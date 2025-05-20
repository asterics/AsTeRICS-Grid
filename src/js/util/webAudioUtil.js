import $ from '../externals/jquery';
import { constants } from './constants';
import { localStorageService } from '../service/data/localStorageService';
import { MainVue } from '../vue/mainVue';
import { i18nService } from '../service/i18nService';

let webAudioUtil = {};

const VOLUME_STEP = 0.15;

let player = document.getElementById('audioPlayer');
let videoPlayer = document.getElementById('videoPlayer');
let volume = 1.0;
let userSettings = localStorageService.getUserSettings();
let playingVideo = false;

webAudioUtil.playUrl = async function (url) {
    if (!url) {
        return;
    }
    return new Promise(resolve => {
        if (url.indexOf('.m3u8') !== -1) {
            playingVideo = true;
            videoPlayer.src = url;
            import(/* webpackChunkName: "hls.js" */ 'hls.js').then((Hls) => {
                Hls = Hls.default;
                if (Hls.isSupported()) {
                    let hls = new Hls();
                    hls.loadSource(radioWithUrl.radioUrl);
                    hls.attachMedia(videoPlayer);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        videoPlayer.play();
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        } else {
            playingVideo = false;
            player.src = url;
            player.play();
            resolve();
        }
    })
};

webAudioUtil.pause = function() {
    player.pause();
    videoPlayer.pause();
}

webAudioUtil.resume = function() {
    if (playingVideo) {
        videoPlayer.play();
    } else {
        player.play();
    }
};

webAudioUtil.isPlaying = function() {
    return isPlaying(videoPlayer) || isPlaying(player);
};

webAudioUtil.isPaused = function() {
    if (playingVideo) {
        return isPaused(videoPlayer);
    } else {
        return isPaused(player);
    }
};

webAudioUtil.seek = function(seconds = 30) {
    if (!webAudioUtil.isPlaying()) {
        return;
    }
    if (playingVideo) {
        seek(videoPlayer, seconds);
    } else {
        seek(player, seconds);
    }
};

webAudioUtil.setCurrentTime = function(seconds = 0) {
    if (playingVideo) {
        videoPlayer.currentTime = seconds;
    } else {
        player.currentTime = seconds;
    }
}

webAudioUtil.getPlayPosition = function() {
    if (playingVideo) {
        return videoPlayer.currentTime;
    } else {
        return player.currentTime;
    }
};

webAudioUtil.volumeUp = function (tooltipKey) {
    volume = volume + VOLUME_STEP <= 1.0 ? volume + VOLUME_STEP : 1;
    return webAudioUtil.setVolume(volume, tooltipKey);
};

webAudioUtil.volumeDown = function (tooltipKey) {
    volume = volume - VOLUME_STEP >= 0 ? volume - VOLUME_STEP : 0;
    return webAudioUtil.setVolume(volume, tooltipKey);
};

webAudioUtil.setVolume = function(volumeParam = undefined, tooltipKey) {
    volume = volumeParam !== undefined ? volumeParam : volume;
    volume = Math.round(volume * 100) / 100;

    let playerVolume = volume * (userSettings.systemVolume / 100.0);
    if (userSettings.systemVolumeMuted) {
        playerVolume = 0;
    }
    player.volume = playerVolume;
    videoPlayer.volume = playerVolume;
    log.debug('set volumes (system, webaudio, player)', userSettings.systemVolume, volume * 100, playerVolume * 100);
    setVolumeTooltip(tooltipKey);
    return volume;
};

function setVolumeTooltip(tooltipKey) {
    if (!tooltipKey) {
        return;
    }
    MainVue.setTooltip(i18nService.t(tooltipKey, Math.round(volume * 100)), {
        revertOnClose: true,
        timeout: 5000
    });
}

function isPlaying(mediaElement) {
    return (
        mediaElement.currentTime > 0 &&
        !mediaElement.paused &&
        !mediaElement.ended &&
        mediaElement.readyState > 2
    );
}

function isPaused(media) {
    return media.paused && media.currentTime > 0 && !media.ended;
}

function seek(media, seconds) {
    let newTime = media.currentTime + seconds;
    newTime = Math.max(0, Math.min(newTime, media.duration));
    media.currentTime = newTime;
}

function updateUserSettings() {
    userSettings = localStorageService.getUserSettings();
    webAudioUtil.setVolume();
}

$(document).on(constants.EVENT_USERSETTINGS_UPDATED, updateUserSettings);
$(document).on(constants.EVENT_USER_CHANGED, updateUserSettings);

export { webAudioUtil };