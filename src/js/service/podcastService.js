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
            break;
        case GridActionPodcast.actions.PAUSE:
            webAudioUtil.pause();
            break;
        case GridActionPodcast.actions.TOGGLE:
            if (!nowPlayingEpisode || (action.podcastGuid && nowPlayingEpisode.podcastGuid !== action.podcastGuid)) {
                await podcastService.playPodcast(action.podcastGuid);
                return;
            }
            if (webAudioUtil.isPlaying()) {
                webAudioUtil.pause();
            } else if (webAudioUtil.isPaused()) {
                webAudioUtil.resume();
            } else {
                await podcastService.playPodcast(action.podcastGuid);
            }
            break;
        case GridActionPodcast.actions.STEP_FORWARD:
            webAudioUtil.seek(action.stepSeconds);
            break;
        case GridActionPodcast.actions.STEP_BACKWARD:
            webAudioUtil.seek(action.stepSeconds * (-1));
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
    await savePlayingData();
};

podcastService.playPodcast = async function(podcastGuid) {
    let episode = getLastPlayedEpisode(podcastGuid);
    if (!episode) {
        let episodes = await fetchEpisodes(podcastGuid);
        episode = episodes[0];
    }
    podcastService.playEpisode(episode);
};

podcastService.playEpisode = function(podcastEpisode) {
    if (!podcastEpisode) {
        return;
    }
    nowPlayingEpisode = podcastEpisode;
    webAudioUtil.playUrl(podcastEpisode.enclosureUrl);
};

podcastService.getPodcasts = async function(searchTerm) {
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
    log.warn(returnObject);
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
    let currentPodcast = metadata.integrations.podcasts.filter(p => p.guid === nowPlayingEpisode.podcastGuid);
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
    if (podcastInfo) {
        return podcastInfo.lastPlayedEpisode;
    }
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
        log.warn("get latest", metadata.integrations.podcasts)
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
