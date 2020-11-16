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
import {GridActionChangeLang} from "./GridActionChangeLang";
import {GridActionYoutube} from "./GridActionYoutube";

class GridElement extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    width: Number,
    height: Number,
    x: [Number],
    y: [Number],
    label: [Object, String, undefined], //map locale -> translation, e.g. "de" => LabelDE
    backgroundColor: [String],
    hidden: [Boolean],
    image: [GridImage],
    actions: [Object],
    type: String
}) {
    constructor(properties, elementToCopy) {
        let defaults = {
            id: "", //will be replaced by constructor
            modelName: GridElement.getModelName(),
            modelVersion: constants.MODEL_VERSION,
            label: {},
            width: 1,
            height: 1,
            type: GridElement.ELEMENT_TYPE_NORMAL
        };
        properties = modelUtil.setDefaults(properties, elementToCopy, GridElement) || {};
        properties.actions = properties.actions || [new GridActionSpeak()];
        super(Object.assign(defaults, properties));
        this.id = this.id || modelUtil.generateId('grid-element')
    }

    duplicate() {
        var newElem = new GridElement(JSON.parse(JSON.stringify(this)));
        newElem.id = modelUtil.generateId('grid-element');
        return newElem;
    }

    toHTML(locale) {
        return templates.getGridItem(this, locale);
    };

    hasSetPosition() {
        return this.x != null && this.x != undefined && this.y != null && this.y != undefined;
    }

    /**
     * returns ID of Grid this element navigates to
     * @return {[String | StringConstructor]|string|default.methods.gridTo.id|null}
     */
    getNavigateGridId() {
        let navAction = this.actions.filter(action => action.modelName === GridActionNavigate.getModelName())[0];
        return navAction ? navAction.toGridId : null;
    }

    static getActionTypes() {
        return [GridActionSpeak, GridActionNavigate, GridActionSpeakCustom, GridActionPredict, GridActionCollectElement, GridActionARE, GridActionWebradio, GridActionYoutube, GridActionChangeLang];
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
GridElement.ELEMENT_TYPE_YT_PLAYER = "ELEMENT_TYPE_YT_PLAYER";

export {GridElement};