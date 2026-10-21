import { MatrixConfigSync } from './MatrixConfigSync.js';

class IntegrationConfigSync {
    /**
     * @param {Object} data
     * @param {Object} data.matrixConfig
     * @param {PodcastInfo[]} data.podcasts
     */
    constructor(data = {}) {
        this.matrixConfig = data.matrixConfig || new MatrixConfigSync();
        this.podcasts = data.podcasts || [];
    }
}

export { IntegrationConfigSync };