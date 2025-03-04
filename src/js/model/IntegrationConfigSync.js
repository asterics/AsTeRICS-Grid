import { MatrixConfigSync } from './MatrixConfigSync.js';

class IntegrationConfigSync {
    /**
     * @param {Object} data
     * @param {Object} data.matrixConfig
     */
    constructor(data = {}) {
        this.matrixConfig = data.matrixConfig || new MatrixConfigSync();
    }
}

export { IntegrationConfigSync };