class GridPreview {
    /**
     * @param {Object} data
     * @param {(string | Object<string, string>)} data.name
     * @param {string} data.url url where to download the data to import
     * @param {string} [data.selfContained] true, if the configuration is a self-contained, false if it's just single boards that could be imported within an existing communicator
     * @param {Array<string>} data.languages
     * @param {string | Object<string, string>} [data.description]
     * @param {string} [data.author]
     * @param {string} [data.website]
     * @param {boolean} [data.wordPrediction]
     * @param {boolean} [data.translate] if true, contents are translated using i18nService
     * @param {Array<string>} data.images array of urls to screenshots
     * @param {Array<string>} data.thumbnail urls to thumbnail
     * @param {string} data.pdf url to downloadable pdf
     * @param {Array<string>} data.tags
     * @param {Object} options
     * @param {string} [options.baseUrl] base url that is appended to all urls (data.url, data.images, data.thumbnail)
     * @param {boolean} [options.hasGlobalGrid] true if this configuration contains a global grid (e.g. collection bar)
     * @param {number|Object<string,number>} [data.priority] priority information about this config, higher numbers mean higher priority, can be a map of langCode -> priority to define different priorities for different languages
     */
    constructor(data, options = {baseUrl: '', githubEditable: false, githubBaseUrl: '', hasGlobalGrid: false}) {
        data.images = data.images || [];
        this.name = data.name;
        this.url = options.baseUrl + data.url;
        if (options.githubEditable) {
            let githubUrl = options.githubBaseUrl + data.url;
            this.githubUrl = githubUrl.substring(0, githubUrl.lastIndexOf('/'));
        }
        this.filename = data.url ? data.url.substring(data.url.lastIndexOf('/') + 1) : '';
        this.selfContained = data.selfContained;
        this.author = data.author;
        this.website = data.website;
        this.languages = data.languages;
        this.description = data.description;
        this.wordPrediction = data.wordPrediction;
        this.translate = data.translate;
        this.images = data.images.map(url => options.baseUrl + url);
        this.thumbnail = data.thumbnail ? options.baseUrl + data.thumbnail : undefined;
        this.tags = data.tags || [];
        this.pdf = data.pdf;
        this.priority = data.priority || 0;
        this.providerName = ''; // set by externalBoardService.js after retrieving of data
        this.providerUrl = '';
        this.originalData = data; // as coming from the original provider
        this.hasGlobalGrid = options.hasGlobalGrid;
    }
}

export { GridPreview };