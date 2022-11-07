let audioUtil = {};

let _beeping = false;

/**
 * see https://stackoverflow.com/a/29641185/9219743
 * @param duration of the tone in milliseconds. Default is 50
 * @param frequency of the tone in hertz. default is 440
 * @param volume of the tone. Default is 1, off is 0.
 * @param type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
 * @param callback to use on end of tone
 */
audioUtil.beep = function (frequency, duration, volume, type, callback) {
    if (_beeping) {
        return;
    }
    _beeping = true;
    let audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = volume || gainNode.gain.value;
    oscillator.frequency.value = frequency || 800;
    oscillator.type = type || oscillator.type;
    oscillator.onended = function() {
        _beeping = false;
        if (callback) {
            callback();
        }
    }
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + ((duration || 50) / 1000));
    setTimeout(() => {
        _beeping = false;
    }, 1000)
};

audioUtil.beepHigh = function () {
    audioUtil.beep(1600);
}

audioUtil.beepHighDouble = function () {
    audioUtil.beep(1600);
    setTimeout(() => {
        audioUtil.beep(1600);
    }, 100);
}

window.audioUtil = audioUtil;

export {audioUtil};