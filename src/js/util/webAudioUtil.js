let webAudioUtil = {};

let player = document.getElementById('audioPlayer');
let videoPlayer = document.getElementById('videoPlayer');

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

webAudioUtil.setCurrentTime = function(seconds) {
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

export { webAudioUtil };