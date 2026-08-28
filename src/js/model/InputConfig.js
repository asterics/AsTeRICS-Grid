import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { InputEventKey } from './InputEventKey';
import { InputEventARE } from './InputEventARE';
import {InputEventAudio} from "./InputEventAudio.js";

class InputConfig extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    globalReadActive: [Boolean], //read out loud active element(s)?
    globalReadActiveRate: [Number],
    globalReadAdditionalActions: [Boolean],
    globalBeepFeedback: [Boolean],
    globalMinPauseCollectSpeak: [Number],
    scanEnabled: [Boolean],
    scanAuto: [Boolean],
    scanTimeoutMs: [Number],
    scanTimeoutFirstElementFactor: [Number], //factor for first element scanning time, e.g. scanTimeoutMs = 1000, scanTimeoutFirstElementFactor = 2 => scanning time for first element = 2000ms
    scanVertical: [Boolean],
    scanBinary: [Boolean],
    scanStartWithAction: [Boolean],
    scanRoundsUntilBack: [Number],
    scanInputs: [Model.Array(Object)], //array with input events with labels InputConfig.NEXT/SELECT
    hoverEnabled: [Boolean],
    hoverTimeoutMs: Number,
    hoverHideCursor: [Boolean],
    hoverDisableHoverpane: [Boolean],
    mouseclickEnabled: [Boolean],
    mouseDoubleClickEnabled: [Boolean],
    mouseDownInsteadClick: [Boolean],
    dirEnabled: [Boolean],
    dirInputs: [Model.Array(Object)], //array with input events with labels InputConfig.UP/DOWN/LEFT/RIGHT/SELECT
    dirWrapAround: [Boolean],
    dirResetToStart: [Boolean],
    seqEnabled: [Boolean],
    seqInputs: [Model.Array(Object)],
    seqAuto: [Boolean],
    seqTimeoutFirstElementFactor: [Number],
    seqTimeoutMs: [Number],
    seqResetToStart: [Boolean],
    seqStartWithAction: [Boolean],
    seqRoundsUntilStop: [Number],
    huffEnabled: [Boolean],
    huffElementCount: [Number],
    huffInputs: [Model.Array(Object)], // ordered array of InputEvent objects
    huffColors: [Model.Array(String)],
    huffShowColors: [Boolean],
    huffShowNumbers: [Boolean],
    huffColorWholeElement: [Boolean],
    huffTimeout: [Number],
    huffMarkInactive: [Boolean],
    codeReaderEnabled: [Boolean], //handheld code reader (digital microscope) input - optional, off by default
    codeReaderFormats: [Model.Array(String)], //ZXing BarcodeFormat names to decode, e.g. DATA_MATRIX, QR_CODE, AZTEC
    codeReaderMatchMode: [String], //how a decoded code is matched to a grid element: 'id', 'label' or 'idAndLabel'
    codeReaderCooldownMs: [Number] //debounce time in ms before the same code can trigger the action again
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputConfig);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-config');
    }

    static getModelName() {
        return 'InputConfig';
    }

    static getInputEventTypes() {
        return [InputEventKey, InputEventAudio, InputEventARE];
    }

    static getInputEventInstance(modelName, options) {
        let constructor = this.getInputEventTypes().filter((type) => type.getModelName() === modelName)[0];
        if (constructor) {
            return new constructor(options);
        } else {
            log.warn('input event type not found: ' + modelName);
        }
    }
}
InputConfig.UP = 'UP';
InputConfig.DOWN = 'DOWN';
InputConfig.LEFT = 'LEFT';
InputConfig.RIGHT = 'RIGHT';
InputConfig.SELECT = 'SELECT';
InputConfig.NEXT = 'NEXT';
InputConfig.NEXT_ELEMENT = 'NEXT_ELEMENT';
InputConfig.PREVIOUS_ELEMENT = 'PREVIOUS_ELEMENT';
InputConfig.GENERAL_INPUT = 'GENERAL_INPUT';
InputConfig.getNumConst = (num) => 'NUM' + num;

InputConfig.CODE_READER_MATCH_ID = 'id';
InputConfig.CODE_READER_MATCH_LABEL = 'label';
InputConfig.CODE_READER_MATCH_ID_AND_LABEL = 'idAndLabel';
InputConfig.CODE_READER_FORMAT_DATA_MATRIX = 'DATA_MATRIX';
InputConfig.CODE_READER_FORMAT_QR_CODE = 'QR_CODE';
InputConfig.CODE_READER_FORMAT_AZTEC = 'AZTEC';
InputConfig.DEFAULT_CODE_READER_FORMATS = [
    InputConfig.CODE_READER_FORMAT_DATA_MATRIX,
    InputConfig.CODE_READER_FORMAT_QR_CODE,
    InputConfig.CODE_READER_FORMAT_AZTEC
];

InputConfig.DEFAULT_SCAN_INPUTS = [
    new InputEventKey({ label: InputConfig.SELECT, keyCode: 32, keyName: 'Space', holdDuration: 400 }),
    new InputEventKey({ label: InputConfig.NEXT, keyCode: 32, keyName: 'Space' })
];
InputConfig.DEFAULT_SEQ_INPUTS = [
    new InputEventKey({ label: InputConfig.SELECT, keyCode: 32, keyName: 'Space' }),
    new InputEventKey({ label: InputConfig.NEXT_ELEMENT, keyCode: 39, keyName: 'ArrowRight' }),
    new InputEventKey({ label: InputConfig.PREVIOUS_ELEMENT, keyCode: 37, keyName: 'ArrowLeft' })
];
InputConfig.DEFAULT_DIR_INPUTS = [
    new InputEventKey({ label: InputConfig.SELECT, keyCode: 32, keyName: 'Space' }),
    new InputEventKey({ label: InputConfig.LEFT, keyCode: 37, keyName: 'ArrowLeft' }),
    new InputEventKey({ label: InputConfig.RIGHT, keyCode: 39, keyName: 'ArrowRight' }),
    new InputEventKey({ label: InputConfig.UP, keyCode: 38, keyName: 'ArrowUp' }),
    new InputEventKey({ label: InputConfig.DOWN, keyCode: 40, keyName: 'ArrowDown' })
];
InputConfig.DEFAULT_HUFF_INPUTS = [
    new InputEventKey({ label: InputConfig.GENERAL_INPUT, keyCode: 49, keyName: 'Digit1' }),
    new InputEventKey({ label: InputConfig.GENERAL_INPUT, keyCode: 50, keyName: 'Digit2' }),
    new InputEventKey({ label: InputConfig.GENERAL_INPUT, keyCode: 51, keyName: 'Digit3' }),
    new InputEventKey({ label: InputConfig.GENERAL_INPUT, keyCode: 52, keyName: 'Digit4' })
];
InputConfig.DEFAULT_HUFF_COLORS = [
    '#D55E00',
    '#F0E442',
    '#009E73',
    '#0072B2',
    '#CC79A7',
    '#E69F00',
    '#56B4E9',
    '#000000',
    '#016619'
];

InputConfig.defaults({
    id: '', //will be replaced by constructor
    modelName: InputConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    globalReadActiveRate: 1,
    globalMinPauseCollectSpeak: 0,
    scanAuto: false,
    scanTimeoutMs: 1000,
    scanTimeoutFirstElementFactor: 1,
    scanBinary: false,
    scanStartWithAction: false,
    scanRoundsUntilBack: 3,
    hoverTimeoutMs: 1000,
    hoverDisableHoverpane: true,
    mouseclickEnabled: true,
    mouseDoubleClickEnabled: false,
    mouseDownInsteadClick: false,
    scanInputs: InputConfig.DEFAULT_SCAN_INPUTS,
    dirInputs: InputConfig.DEFAULT_DIR_INPUTS,
    seqInputs: InputConfig.DEFAULT_SEQ_INPUTS,
    seqAuto: false,
    seqTimeoutMs: 1000,
    seqTimeoutFirstElementFactor: 1,
    seqResetToStart: true,
    seqStartWithAction: false,
    seqRoundsUntilStop: 3,
    dirWrapAround: true,
    huffInputs: InputConfig.DEFAULT_HUFF_INPUTS,
    huffColors: InputConfig.DEFAULT_HUFF_COLORS,
    huffShowColors: true,
    huffShowNumbers: true,
    huffElementCount: 0,
    huffTimeout: 4000,
    huffMarkInactive: true,
    codeReaderEnabled: false,
    codeReaderFormats: InputConfig.DEFAULT_CODE_READER_FORMATS,
    codeReaderMatchMode: InputConfig.CODE_READER_MATCH_ID_AND_LABEL,
    codeReaderCooldownMs: 1500
});

export { InputConfig };
