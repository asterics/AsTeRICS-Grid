import { dataService } from './data/dataService';
import { GridActionPodcast } from '../model/GridActionPodcast';
import { PodcastEpisode, PodcastInfo } from '../model/PodcastInfo';
import { webAudioUtil } from '../util/webAudioUtil';
import { constants } from '../util/constants';
import { MapCache } from '../util/MapCache';
import { localStorageService } from './data/localStorageService';

let podcastService = {};

let metadata = null;
let nowPlayingEpisode = null;
let volume = localStorageService.getJSON(constants.PODCAST_LAST_VOLUME_KEY) || 1.0;
let cache = new MapCache({
    ttlMs: 30 * 60 * 1000 // 30 minutes
});

podcastService.doAction = async function (action) {
    if (action.performAfterNav) {
        podcastService.setActionAfterNavigate(action);
        return;
    }
    switch (action.action) {
        case GridActionPodcast.actions.PLAY:
            await podcastService.playPodcast(action.podcastGuid);
            await savePlayingData();
            break;
        case GridActionPodcast.actions.PAUSE:
            await podcastService.pause();
            await savePlayingData();
            break;
        case GridActionPodcast.actions.TOGGLE:
            await podcastService.toggle(action.podcastGuid);
            await savePlayingData();
            break;
        case GridActionPodcast.actions.STEP_FORWARD:
            webAudioUtil.seek(action.stepSeconds);
            await savePlayingData();
            break;
        case GridActionPodcast.actions.STEP_BACKWARD:
            webAudioUtil.seek(action.stepSeconds * (-1));
            await savePlayingData();
            break;
        case GridActionPodcast.actions.LATEST_EPISODE:
            await podcastService.playLatestEpisode(action.podcastGuid);
            await savePlayingData();
            break;
        case GridActionPodcast.actions.NEXT_EPISODE:
            await podcastService.nextEpisode();
            await savePlayingData();
            break;
        case GridActionPodcast.actions.PREV_EPISODE:
            await podcastService.previousEpisode();
            await savePlayingData();
            break;
        case GridActionPodcast.actions.VOLUME_UP:
            podcastService.volumeUp();
            break;
        case GridActionPodcast.actions.VOLUME_DOWN:
            podcastService.volumeDown();
            break;
    }
};

podcastService.getState = function() {
    let currentPodcast = getCurrentPodcast() || {};
    let currentEpisode = nowPlayingEpisode || {};
    let duration = currentEpisode.duration || 0;
    let playPosition = webAudioUtil.getPlayPosition() || 0;
    return {
        podcastTitle: currentPodcast.title,
        episodeTitle: currentEpisode.title,
        currentSeconds: playPosition,
        remainingSeconds: Math.max(0, duration - playPosition),
        podcastDescription: currentPodcast.description,
        episodeDescription: currentEpisode.description
    }
}

podcastService.playPodcast = async function(podcastGuid) {
    if (webAudioUtil.isPlaying()) {
        await savePlayingData();
    }
    podcastGuid = podcastGuid || getLastPlayedPodcastGuid();
    if (!podcastGuid) {
        return;
    }
    let episode = getLastPlayedEpisode(podcastGuid);
    if (!episode) {
        return podcastService.playLatestEpisode(podcastGuid);
    }
    await podcastService.playEpisode(episode);
};

podcastService.playLatestEpisode = async function(podcastGuid) {
    podcastGuid = podcastGuid || getLastPlayedPodcastGuid();
    if (!podcastGuid) {
        return;
    }
    let episodes = (await fetchEpisodes(podcastGuid)) || [];
    if (episodes.length === 0) {
        return;
    }
    if (!nowPlayingEpisode || nowPlayingEpisode.guid !== episodes[0].guid) {
        await podcastService.playEpisode(episodes[0]);
    }
};

podcastService.nextEpisode = async function() {
    if (!nowPlayingEpisode) {
        return;
    }
    let episodes = (await fetchEpisodes(nowPlayingEpisode.podcastGuid)) || [];
    let currentIndex = episodes.findIndex(e => e.guid === nowPlayingEpisode.guid);
    if (currentIndex <= 0) {
        log.info("podcast: no newer episode found");
        return;
    }
    await podcastService.playEpisode(episodes[currentIndex - 1]);
};

podcastService.previousEpisode = async function() {
    if (!nowPlayingEpisode) {
        return;
    }
    let episodes = (await fetchEpisodes(nowPlayingEpisode.podcastGuid)) || [];
    let currentIndex = episodes.findIndex(e => e.guid === nowPlayingEpisode.guid);
    if (currentIndex === -1 || currentIndex >= episodes.length - 1) {
        log.info("podcast: no next episode found");
        return;
    }
    await podcastService.playEpisode(episodes[currentIndex + 1]);
};

podcastService.playEpisode = async function(podcastEpisode) {
    if (!podcastEpisode) {
        return;
    }
    let lastPlayedEpisode = getLastPlayedEpisode(podcastEpisode.podcastGuid);
    if (lastPlayedEpisode && lastPlayedEpisode.guid === podcastEpisode.guid) {
        // use last played episode in order to use current playing time
        podcastEpisode = lastPlayedEpisode;
    }
    nowPlayingEpisode = podcastEpisode;
    await webAudioUtil.playUrl(podcastEpisode.enclosureUrl);
    webAudioUtil.setVolume(volume);
    webAudioUtil.setCurrentTime(podcastEpisode.lastPlayPosition);
};

/**
 * starts or stops a podcast by given guid. if a podcast episode from the given guid is currently played, this
 * episode is started / stopped, otherwise the latest episode is used.
 * @param podcastGuid
 * @returns {*|null} null, if now paused, the playing podcast guid, if now playing
 */
podcastService.toggle = async function(podcastGuid) {
    if (!nowPlayingEpisode || (podcastGuid && nowPlayingEpisode.podcastGuid !== podcastGuid)) {
        await podcastService.playPodcast(podcastGuid);
        return podcastGuid;
    }
    if (webAudioUtil.isPlaying()) {
        await podcastService.pause();
        return null;
    } else if (webAudioUtil.isPaused()) {
        webAudioUtil.resume();
        return podcastGuid;
    } else {
        await podcastService.playPodcast(podcastGuid);
        return podcastGuid;
    }
};

podcastService.pause = async function() {
    webAudioUtil.pause();
};

podcastService.volumeUp = function () {
    volume = webAudioUtil.volumeUp('podcastVolume');
    localStorageService.saveJSON(constants.PODCAST_LAST_VOLUME_KEY, volume);
};

podcastService.volumeDown = function () {
    volume = webAudioUtil.volumeDown('podcastVolume');
    localStorageService.saveJSON(constants.PODCAST_LAST_VOLUME_KEY, volume);
};

podcastService.search = async function(searchTerm) {
    if (!searchTerm) {
        return [];
    }
    if (cache.has(searchTerm)) {
        return cache.get(searchTerm);
    }
    let params = new URLSearchParams();
    params.set('endpoint', 'search;byterm');
    params.set('q', searchTerm);
    let response = await fetch('https://api.asterics-foundation.org/podcastindex.php?' + params.toString());
    if (!response.ok) {
        return [];
    }
    let returnObject = await response.json() || {};
    let returnValue = PodcastInfo.parseListFromApi(returnObject.feeds);
    cache.set(searchTerm, returnValue);
    return returnValue;
};

/**
 * adds a podcast to the selected podcasts
 * @param {PodcastInfo} podcastInfo
 */
podcastService.selectPodcast = async function(podcastInfo) {
    metadata.integrations.podcasts.push(podcastInfo);
    await dataService.saveMetadata(metadata);
}

/**
 * removes a podcast from the selected podcasts
 * @param {string} podcastGuid
 */
podcastService.removePodcast = async function(podcastGuid) {
    metadata.integrations.podcasts = metadata.integrations.podcasts.filter(podcast => podcast.guid !== podcastGuid);
    await dataService.saveMetadata(metadata);
}

async function savePlayingData() {
    let currentPodcast = getCurrentPodcast();
    if (!currentPodcast) {
        return;
    }
    currentPodcast.lastPlayedEpisode = nowPlayingEpisode;
    currentPodcast.lastPlayedEpisode.lastPlayedTime = new Date().getTime();
    currentPodcast.lastPlayedEpisode.lastPlayPosition = webAudioUtil.getPlayPosition();
    await dataService.saveMetadata(metadata);
}

function getLastPlayedPodcastGuid() {
    if (nowPlayingEpisode) {
        return nowPlayingEpisode.podcastGuid;
    }
    let podcastInfo = getPodcastInfo();
    return podcastInfo ? podcastInfo.guid : null;
}

function getCurrentPodcast() {
    if (!nowPlayingEpisode) {
        return null;
    }
    return metadata.integrations.podcasts.find(p => p.guid === nowPlayingEpisode.podcastGuid);
}

/**
 * fetch episodes by given podcast guid
 * @param podcastGuid
 * @param options
 * @param options.max maximum count of episodes to fetch
 * @param options.since timestamp since the episodes should be fetched
 */
async function fetchEpisodes(podcastGuid, options = {}) {
    if (!podcastGuid) {
        return [];
    }
    if (cache.has(podcastGuid)) {
        return cache.get(podcastGuid);
    }
    let params = new URLSearchParams();
    params.set('endpoint', 'episodes;bypodcastguid');
    params.set('guid', podcastGuid);
    if (options.max) {
        params.set('max', options.max);
    }
    let response = await fetch('https://api.asterics-foundation.org/podcastindex.php?' + params.toString());
    if (!response.ok) {
        return [];
    }
    let returnObject = await response.json() || {};
    let returnValue = PodcastEpisode.parseListFromApi(returnObject.items);
    cache.set(podcastGuid, returnValue);
    return PodcastEpisode.parseListFromApi(returnValue);
}


function getLastPlayedEpisode(podcastGuid = '') {
    let podcastInfo = getPodcastInfo(podcastGuid);
    if (podcastInfo && podcastInfo.lastPlayedEpisode && podcastInfo.lastPlayedEpisode.guid) {
        return podcastInfo.lastPlayedEpisode;
    }
    return null;
}

/**
 * gets a podcast info either by guid or the last played podcast
 * @param podcastGuid optional, if not specified last played podcast is returned
 * @returns {PodcastInfo|undefined} found podcastInfo or undefined
 */
function getPodcastInfo(podcastGuid = null) {
    if (podcastGuid) {
        return metadata.integrations.podcasts.find(p => p.guid === podcastGuid);
    } else {
        let sorted = metadata.integrations.podcasts.sort((a, b) => b.lastPlayedEpisode.lastPlayedTime - a.lastPlayedEpisode.lastPlayedTime);
        return sorted[0];
    }
}

async function updateMetadata() {
    metadata = await dataService.getMetadata();
}

$(document).on(constants.EVENT_USER_CHANGED, updateMetadata);
$(document).on(constants.EVENT_METADATA_UPDATED, updateMetadata);

export { podcastService };
