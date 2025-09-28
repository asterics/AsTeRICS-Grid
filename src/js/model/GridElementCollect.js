import { GridElement } from './GridElement.js';
import { GridActionCollectElement } from './GridActionCollectElement.js';
import { GridActionPredict } from './GridActionPredict.js';

class GridElementCollect extends GridElement.extend({
    showLabels: [Boolean],
    showFullLabels: [Boolean],
    imageHeightPercentage: [Number],
    mode: [String],
    singleLine: [Boolean],
    convertToLowercase: [Boolean],
    textElemSizeFactor: [Number],
    displayUpsideDown: [Boolean],
    partnerSource: [String]
}) {
    constructor(props) {
        props = props || {};
        props.showLabels = true;
        props.singleLine = true;
        props.convertToLowercase = props.convertToLowercase !== undefined ? props.convertToLowercase : false;
        props.imageHeightPercentage = 85;
        props.mode = GridElementCollect.MODE_AUTO;
        props.type = GridElement.ELEMENT_TYPE_COLLECT;
        props.textElemSizeFactor = 1.5;
        props.displayUpsideDown = props.displayUpsideDown !== undefined ? props.displayUpsideDown : false;
        props.partnerSource = props.partnerSource || GridElementCollect.PARTNER_SOURCE_LOCAL;
        props.actions = props.actions || [
            new GridActionCollectElement({ action: GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS }),
            new GridActionPredict({ suggestOnChange: true, dictionaryKey: GridActionPredict.USE_DICTIONARY_CURRENT_LANG })
        ];
        super(props);
    }
}

GridElementCollect.MODE_AUTO = 'MODE_AUTO';
GridElementCollect.MODE_COLLECT_SEPARATED = 'MODE_COLLECT_SEPARATED';
GridElementCollect.MODE_COLLECT_TEXT = 'MODE_COLLECT_TEXT';
GridElementCollect.MODES = [
    GridElementCollect.MODE_AUTO,
    GridElementCollect.MODE_COLLECT_SEPARATED,
    GridElementCollect.MODE_COLLECT_TEXT
];

GridElementCollect.PARTNER_SOURCE_LOCAL = "local";
GridElementCollect.PARTNER_SOURCE_PARTNER = "partner";
GridElementCollect.PARTNER_SOURCE_BOTH = "both";
GridElementCollect.PARTNER_SOURCES = [
    GridElementCollect.PARTNER_SOURCE_LOCAL,
    GridElementCollect.PARTNER_SOURCE_PARTNER,
    GridElementCollect.PARTNER_SOURCE_BOTH
];

export { GridElementCollect };
