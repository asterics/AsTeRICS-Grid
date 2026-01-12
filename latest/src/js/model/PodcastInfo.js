export class PodcastInfo {
    /**
     * @param {Object} data
     * @param {string} data.guid
     * @param {string} data.title
     * @param {string} data.description
     * @param {string} data.image
     * @param {string} data.link
     * @param {string} data.author
     * @param {Object} data.categories
     * @param {Object} data.language
     * @param {PodcastEpisode} data.lastPlayedEpisode
     */
    constructor(data = {}) {
        this.guid = data.guid;
        this.title = data.title;
        this.description = data.description;
        this.image = data.image;
        this.link = data.link;
        this.author = data.author;
        this.categories = data.categories;
        this.language = data.language;
        this.lastPlayedEpisode = data.lastPlayedEpisode || new PodcastEpisode();
    }

    static parseListFromApi(dataList) {
        if (!Array.isArray(dataList)) {
            log.warn('no valid podcast data', dataList);
            return [];
        }
        return dataList.map(item => {
            return new PodcastInfo({
                guid: item.podcastGuid,
                title: item.title,
                description: item.description,
                image: item.image,
                link: item.link,
                author: item.author,
                categories: item.categories,
                language: item.language
            });
        });
    }
}

export class PodcastEpisode {
    /**
     * class for information about the last played episode state from a podcast
     * @param {Object} data
     * @param {string} data.guid
     * @param {string} data.podcastGuid
     * @param {string} data.datePublished
     * @param {string} data.title
     * @param {string} data.description
     * @param {string} data.enclosureUrl url containing the audio data
     * @param {string} data.duration
     * @param {number} data.lastPlayedTime last time this episode was played
     * @param {number} data.lastPlayPosition play position of time last played
     */
    constructor(data = {}) {
        this.guid = data.guid;
        this.podcastGuid = data.podcastGuid;
        this.datePublished = data.datePublished;
        this.title = data.title;
        this.description = data.description;
        this.enclosureUrl = data.enclosureUrl;
        this.duration = data.duration;
        this.lastPlayedTime = data.lastPlayedTime || 0;
        this.lastPlayPosition = data.lastPlayPosition || 0;
    }

    static parseListFromApi(dataList) {
        if(!Array.isArray(dataList)) {
            log.warn("no valid podcast episode data", dataList);
            return [];
        }
        return dataList.map(item => {
            return new PodcastEpisode({
                guid: item.guid,
                podcastGuid: item.podcastGuid,
                datePublished: item.datePublished,
                title: item.title,
                description: item.description,
                enclosureUrl: item.enclosureUrl,
                duration: item.duration
            })
        });
    }
}