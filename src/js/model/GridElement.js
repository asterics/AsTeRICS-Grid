import {modelUtil} from "../util/modelUtil";
import {templates} from "../templates";
import {GridImage} from "./GridImage";
import {GridActionSpeak} from "./GridActionSpeak";
import {GridActionSpeakCustom} from "./GridActionSpeakCustom";
import {GridActionNavigate} from "./GridActionNavigate";
import {GridActionARE} from "./GridActionARE";
import {GridActionPredict} from "./GridActionPredict";
import {GridActionCollectElement} from "./GridActionCollectElement";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {GridActionWebradio} from "./GridActionWebradio";

class GridElement extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    width: Number,
    height: Number,
    x: [Number],
    y: [Number],
    label: [String],
    image: [GridImage],
    actions: [Object],
    type: String
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridElement);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-element')
    }

    duplicate() {
        var newElem = new GridElement(JSON.parse(JSON.stringify(this)));
        newElem.id = modelUtil.generateId('grid-element');
        return newElem;
    }

    toHTML() {
        return templates.getGridItem(this);
    };

    hasSetPosition() {
        return this.x != null && this.x != undefined && this.y != null && this.y != undefined;
    }

    static getActionTypes() {
        return [GridActionSpeak, GridActionNavigate, GridActionSpeakCustom, GridActionPredict, GridActionCollectElement, GridActionARE, GridActionWebradio];
    }

    static getActionInstance(modelName) {
        var constructor = this.getActionTypes().filter(type => type.getModelName() == modelName)[0];
        if(constructor) {
            return new constructor();
        } else {
            log.warn('action type not found: ' + modelName);
        }
    }

    static getModelName() {
        return "GridElement";
    }
}

GridElement.ELEMENT_TYPE_NORMAL = "ELEMENT_TYPE_NORMAL";
GridElement.ELEMENT_TYPE_COLLECT = "ELEMENT_TYPE_COLLECT";
GridElement.ELEMENT_TYPE_PREDICTION = "ELEMENT_TYPE_PREDICTION";

GridElement.defaults({
    id: "", //will be replaced by constructor
    modelName: GridElement.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    width: 2,
    height: 1,
    actions: [new GridActionSpeak()],
    type: GridElement.ELEMENT_TYPE_NORMAL
});

export {GridElement};