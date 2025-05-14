import { dataService } from './data/dataService';
import { GridActionPodcast } from '../model/GridActionPodcast';
import { PodcastEpisode, PodcastInfo } from '../model/PodcastInfo';
import { webAudioUtil } from '../util/webAudioUtil';
import { constants } from '../util/constants';

let podcastService = {};

let metadata = null;
let nowPlayingEpisode = null;

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
        case GridActionPodcast.actions.NEXT_EPISODE:
            break;
        case GridActionPodcast.actions.PREV_EPISODE:
            break;
        case GridActionPodcast.actions.VOLUME_UP:
            break;
        case GridActionPodcast.actions.VOLUME_DOWN:
            break;
        case GridActionPodcast.actions.VOLUME_MUTE:
            break;
    }
};

podcastService.playPodcast = async function(podcastGuid) {
    if (webAudioUtil.isPlaying()) {
        await savePlayingData();
    }
    let episode = getLastPlayedEpisode(podcastGuid);
    if (!episode) {
        let episodes = await fetchEpisodes(podcastGuid);
        episode = episodes[0];
    }
    await podcastService.playEpisode(episode);
};

podcastService.playEpisode = async function(podcastEpisode) {
    if (!podcastEpisode) {
        return;
    }
    nowPlayingEpisode = podcastEpisode;
    await webAudioUtil.playUrl(podcastEpisode.enclosureUrl);
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

podcastService.search = async function(searchTerm) {
    if (!searchTerm) {
        return [];
    }
    let params = new URLSearchParams();
    params.set('endpoint', 'search;byterm');
    params.set('q', searchTerm);
    let response = await fetch('https://api.asterics-foundation.org/podcastindex.php?' + params.toString());
    if (!response.ok) {
        return [];
    }
    let returnObject = await response.json() || {};
    return PodcastInfo.parseListFromApi(returnObject.feeds);
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
    if (!nowPlayingEpisode) {
        return;
    }
    let currentPodcast = metadata.integrations.podcasts.find(p => p.guid === nowPlayingEpisode.podcastGuid) || {};
    currentPodcast.lastPlayedEpisode = nowPlayingEpisode;
    currentPodcast.lastPlayedEpisode.lastPlayedTime = new Date().getTime();
    currentPodcast.lastPlayedEpisode.lastPlayPosition = webAudioUtil.getPlayPosition();
    await dataService.saveMetadata(metadata);
}

/**
 * fetch episodes by given podcast guid
 * @param podcastGuid
 * @param options
 * @param options.max maximum count of episodes to fetch, defaults to 10
 * @param options.since timestamp since the episodes should be fetched
 */
async function fetchEpisodes(podcastGuid, options = {}) {
    if (!podcastGuid) {
        return [];
    }
    options.max = options.max || 10;
    let params = new URLSearchParams();
    params.set('endpoint', 'episodes;bypodcastguid');
    params.set('guid', podcastGuid);
    params.set('max', options.max);
    let response = await fetch('https://api.asterics-foundation.org/podcastindex.php?' + params.toString());
    if (!response.ok) {
        return [];
    }
    let returnObject = await response.json() || {};
    return PodcastEpisode.parseListFromApi(returnObject.items);
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
function getPodcastInfo(podcastGuid) {
    if (podcastGuid) {
        return metadata.integrations.podcasts.find(p => p.guid === podcastGuid);
    } else {
        let sorted = metadata.integrations.podcasts.sort((a, b) => b.currentEpisode.lastPlayedTime - a.currentEpisode.lastPlayedTime);
        return sorted[0];
    }
}

async function updateMetadata() {
    metadata = await dataService.getMetadata();
}

$(document).on(constants.EVENT_USER_CHANGED, updateMetadata);
$(document).on(constants.EVENT_METADATA_UPDATED, updateMetadata);

export { podcastService };
