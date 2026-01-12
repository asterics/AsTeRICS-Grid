const voiceUtil = {};

const MICROSOFT = "MICROSOFT";
const ONLINE = "ONLINE";
const NATURAL = "NATURAL";
let msRealOfflineVoices = ['Adam', 'An', 'Andika', 'Andrei', 'Anna', 'Asaf', 'Ayumi', 'Bart', 'Bengt', 'Caroline', 'Catherine', 'Claude', 'Cosimo', 'Daniel', 'Danny', 'David', 'Elsa', 'Filip', 'Frank', 'George', 'Guillaume', 'Hanhan', 'Haruka', 'Hazel', 'Heami', 'Hedda', 'Heera', 'Heidi', 'Helena', 'Helia', 'Hemant', 'Hoda', 'Hortense', 'Huihui', 'Ichiro', 'Irina', 'Ivan', 'Jakub', 'James', 'Jon', 'Julie', 'Kalpana', 'Kangkang', 'Karsten', 'Katja', 'Lado', 'Laura', 'Linda', 'Maria', 'Mark', 'Mary', 'Matej', 'Michael', 'Naayf', 'Pablo', 'Pattara', 'Paul', 'Paulina', 'Pavel', 'Raul', 'Ravi', 'Richard', 'Rizwan', 'Sabina', 'Sam', 'Sean', 'Stefan', 'Stefanos', 'Susan', 'Szabolcs', 'Tolga', 'Tracy', 'Valluvar', 'Yaoyao', 'Yating', 'Zhiwei', 'Zira'];

/**
 * returns if a voice can be assumed to be offline. Fixes the problem, that Firefox returns "localService" to be true
 * for many online MS voices on Windows.
 *
 * @param voiceId
 * @param voiceName
 * @param localServiceProperty
 * @returns {*|boolean}
 */
voiceUtil.isVoiceOffline = function(voiceId, voiceName, localServiceProperty) {
    if (!voiceId || !voiceName) {
        return false;
    }
    if (!localServiceProperty) {
        // trust everything which is indicated as "online"
        return false;
    }
    let voiceTotal = (voiceId + voiceName).toUpperCase();
    let isMSVoice = voiceTotal.includes(MICROSOFT);
    if (!isMSVoice) {
        return localServiceProperty;
    }
    if (voiceTotal.includes(ONLINE) || voiceTotal.includes(NATURAL)) {
        return false;
    }
    if (msRealOfflineVoices.some(offlineName => voiceTotal.includes(offlineName.toUpperCase()))) {
        return true;
    }
    return false;
};

export default voiceUtil;