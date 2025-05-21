import { MatrixConfigLocal } from './MatrixConfigLocal';

class IntegrationConfigLocal {
    /**
     * @param {Object} data
     * @param {Object} data.matrixConfig
     */
    constructor(data = {}) {
        this.matrixConfig = data.matrixConfig || new MatrixConfigLocal();
    }
}

export { IntegrationConfigLocal };