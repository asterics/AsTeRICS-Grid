import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

/**
 * InputEventFace
 * A generic facial-gesture input event powered by MediaPipe FaceLandmarker.
 *
 * Notes:
 * - The label (e.g., SELECT/NEXT/UP/...) is passed in by the UI but is not strictly part of the model here.
 * - Gesture thresholds are configurable and interpreted by the facelandmarkerService.
 */
class InputEventFace extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    // Which gesture to detect
    gestureType: [String],
    // Thresholds and behavior tuning
    blinkScoreThreshold: [Number],
    gazeScoreThreshold: [Number],
    headTiltDegThreshold: [Number],
    headMoveNormThreshold: [Number],
    dwellMs: [Number],
    debounceMs: [Number],
    smoothingAlpha: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputEventFace);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-event-face');
    }

    isValid() {
        return this.modelName && this.gestureType;
    }

    static getModelName() {
        return 'InputEventFace';
    }
}

InputEventFace.defaults({
    id: '', // will be replaced by constructor
    modelName: InputEventFace.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    gestureType: 'BLINK_BOTH',
    blinkScoreThreshold: 0.5,
    gazeScoreThreshold: 0.5,
    headTiltDegThreshold: 15,
    headMoveNormThreshold: 0.15,
    dwellMs: 150,
    debounceMs: 400,
    smoothingAlpha: 0.5
});

// Common gesture type constants (UI can reference these)
InputEventFace.GESTURES = {
    BLINK_LEFT: 'BLINK_LEFT',
    BLINK_RIGHT: 'BLINK_RIGHT',
    BLINK_BOTH: 'BLINK_BOTH',
    EYES_LEFT: 'EYES_LEFT',
    EYES_RIGHT: 'EYES_RIGHT',
    EYES_UP: 'EYES_UP',
    EYES_DOWN: 'EYES_DOWN',
    HEAD_TILT_LEFT: 'HEAD_TILT_LEFT',
    HEAD_TILT_RIGHT: 'HEAD_TILT_RIGHT',
    HEAD_LEFT: 'HEAD_LEFT',
    HEAD_RIGHT: 'HEAD_RIGHT',
    HEAD_UP: 'HEAD_UP',
    HEAD_DOWN: 'HEAD_DOWN',
    BROW_RAISE: 'BROW_RAISE',
    CHEEK_PUFF: 'CHEEK_PUFF',
    TONGUE_OUT: 'TONGUE_OUT',
    SMILE: 'SMILE',
    FROWN: 'FROWN',
    JAW_OPEN: 'JAW_OPEN'
};

export { InputEventFace };

