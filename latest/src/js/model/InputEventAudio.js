import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class InputEventAudio extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    volThresholdHigh: [Number],
    volThresholdLow: [Number],
    freqThresholdHigh: [Number],
    freqThresholdLow: [Number],
    debounceMs: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputEventAudio);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-event-audio');
    }

    isValid() {
        return this.modelName && this.volThresholdHigh !== undefined && this.volThresholdLow !== undefined;
    }

    static getModelName() {
        return 'InputEventAudio';
    }
}

InputEventAudio.defaults({
    id: '', //will be replaced by constructor
    modelName: InputEventAudio.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    volThresholdHigh: 5,
    volThresholdLow: 1,
    freqThresholdHigh: 20000,
    freqThresholdLow: 0,
    debounceMs: 200,
});

export { InputEventAudio };
