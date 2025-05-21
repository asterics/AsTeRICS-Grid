import { MainVue } from '../vue/mainVue.js';
import { util } from '../util/util';
import { audioUtil } from '../util/audioUtil';
import { Router } from '../router';
import $ from '../externals/jquery';
import { constants } from '../util/constants';

let eastereggService = {};
let speakCount = 0;
let stop = false;
const keyword10000 = 'asterics';

eastereggService.checkTypedWord = function(lastTyped) {
    if (keyword10000.startsWith(lastTyped.toLowerCase())) {
        if (keyword10000 === lastTyped.toLowerCase()) {
            lastTyped = '';
            startEasteregg10000();
        }
    } else {
        lastTyped = '';
    }
    return lastTyped;
};

function onSpeeakingText(event, text = '') {
    if (text.toLowerCase().trim() === keyword10000) {
        speakCount++;
    } else {
        speakCount = 0;
    }
    if (speakCount === 3) {
        startEasteregg10000();
        speakCount = 0;
    }
}

async function startEasteregg10000() {
    if (!Router.isOnGridView() || MainVue.searchModalOpened()) {
        return;
    }
    stop = false;
    let gridElements = Array.from(document.getElementsByClassName('grid-item-content'));
    let colors = generateRainbowHslColors(gridElements.length);
    let originals = gridElements.map(e => e.style.backgroundColor);
    MainVue.setTooltip('🥳 Happy Birthday AsTeRICS Grid! On 24.05.2025 it turned 7 years and this easter egg was created with commit 10 000! 🥳', {
        timeout: 20000,
        actionLink: 'Stop',
        actionLinkFn: () => {
            stop = true;
            MainVue.clearTooltip();
        }
    });
    playMelody(melodyHappyBirthday);
    await colorElements(gridElements, colors, originals);
    let setupTime = gridElements.length * 25;
    let sleepMs = util.mapRange(gridElements.length, 10, 100, 300, 50);
    let loopCount = Math.max(0, ((16750 - 2 * setupTime) / sleepMs));
    for (let i = 0; i < loopCount && !stop; i++) {
        await colorElements(gridElements, colors, originals, { shift: i + 1, sleep: 0});
        await util.sleep(sleepMs);
    }
    await colorElements(gridElements, colors, originals, { flipColors: true, reset: true, force: true });
}

async function playMelody(melody) {
    for (const [note, duration] of melody) {
        if (stop) {
            return;
        }
        await audioUtil.beep(notes[note], duration, 0.1);
        await util.sleep(50);
    }

}

const melodyHappyBirthday = [
    ['C5', 300], ['C5', 300], ['D5', 600], ['C5', 600], ['F5', 600], ['E5', 1200],
    ['C5', 300], ['C5', 300], ['D5', 600], ['C5', 600], ['G5', 600], ['F5', 1200],
    ['C5', 300], ['C5', 300], ['C6', 600], ['A5', 600], ['F5', 600], ['E5', 600], ['D5', 1200],
    ['Bb5', 300], ['Bb5', 300], ['A5', 600], ['F5', 600], ['G5', 600], ['F5', 1200]
];

const notes = {
    C5: 523.25,
    C6: 1046.50, // Added C6
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.00,
    Bb5: 932.33
};

function generateRainbowHslColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.round((i * 360) / count);
        colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
}

async function colorElements(elements, colors, originals, options = {}) {
    options.sleep = options.sleep === undefined ? 25 : options.sleep;
    options.shift = options.shift || 0;
    for (let [index, element] of elements.entries()) {
        if (!options.force && stop) {
            return;
        }
        let colorIndex = (index + options.shift) % elements.length;
        element.style.backgroundColor = colors[options.flipColors ? (elements.length - 1 - colorIndex) : colorIndex];
        if (options.sleep) {
            await util.sleep(options.sleep);
        }
        if (options.reset) {
            element.style.backgroundColor = originals[index];
        }
    }
}

$(document).on(constants.EVENT_SPEAKING_TEXT, onSpeeakingText);

export { eastereggService };
