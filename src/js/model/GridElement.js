import { modelUtil } from '../util/modelUtil';
import { templates } from '../templates';
import { GridImage } from './GridImage';
import { GridActionSpeak } from './GridActionSpeak';
import { GridActionSpeakCustom } from './GridActionSpeakCustom';
import { GridActionNavigate } from './GridActionNavigate';
import { GridActionARE } from './GridActionARE';
import { GridActionOpenHAB } from './GridActionOpenHAB';
import { GridActionPredict } from './GridActionPredict';
import { GridActionCollectElement } from './GridActionCollectElement';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { GridActionWebradio } from './GridActionWebradio';
import { GridActionChangeLang } from './GridActionChangeLang';
import { GridActionYoutube } from './GridActionYoutube';
import { GridActionOpenWebpage } from './GridActionOpenWebpage.js';
import { GridActionAudio } from './GridActionAudio.js';
import { GridActionHTTP } from "./GridActionHTTP.js";
import {GridActionWordForm} from "./GridActionWordForm.js";
import { GridActionUART } from './GridActionUART.js';
import { GridActionSystem } from './GridActionSystem';

class GridElement extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    width: Number,
    height: Number,
    x: [Number],
    y: [Number],
    label: [Object, String, undefined], //map locale -> translation, e.g. "de" => LabelDE
    wordForms: [Model.Array(Object)], //Array of WordForm, removed for performance reasons
    backgroundColor: [String],
    colorCategory: [String],
    hidden: [Boolean],
    dontCollect: [Boolean],
    toggleInBar: [Boolean],
    image: [GridImage],
    actions: [Object],
    type: String,
    additionalProps: [Object]
}) {
    constructor(properties, elementToCopy) {
        let defaults = {
            id: '', //will be replaced by constructor
            modelName: GridElement.getModelName(),
            modelVersion: constants.MODEL_VERSION,
            label: {},
            width: 1,
            height: 1,
            image: new GridImage(),
            type: GridElement.ELEMENT_TYPE_NORMAL,
            additionalProps: {}
        };
        properties = modelUtil.setDefaults(properties, elementToCopy, GridElement) || {};
        properties.actions = properties.actions || [new GridActionSpeak()];
        properties.wordForms = properties.wordForms || [];
        super(Object.assign(defaults, properties));
        this.id = this.id || modelUtil.generateId('grid-element');
    }

    duplicate() {
        var newElem = new GridElement(JSON.parse(JSON.stringify(this)));
        newElem.id = modelUtil.generateId('grid-element');
        return newElem;
    }

    toHTML(metadata) {
        return templates.getGridItem(this, metadata);
    }

    hasSetPosition() {
        return this.x != null && this.x != undefined && this.y != null && this.y != undefined;
    }

    /**
     * returns ID of Grid this element navigates to
     * @return {[String | StringConstructor]|string|default.methods.gridTo.id|null}
     */
    getNavigateGridId() {
        let navAction = this.actions.filter((action) => action.modelName === GridActionNavigate.getModelName())[0];
        return navAction ? navAction.toGridId : null;
    }

    static getActionTypes() {
        return [
            GridActionSpeak,
            GridActionNavigate,
            GridActionSpeakCustom,
            GridActionAudio,
            GridActionWordForm,
            GridActionPredict,
            GridActionCollectElement,
            GridActionARE,
            GridActionOpenHAB,
            GridActionWebradio,
            GridActionYoutube,
            GridActionChangeLang,
            GridActionOpenWebpage,
            GridActionHTTP,
            GridActionUART,
            GridActionSystem
        ];
    }

    static getActionTypeModelNames() {
        return this.getActionTypes().map((action) => action.getModelName());
    }

    static getActionInstance(modelName) {
        let constructor = this.getActionClass(modelName);
        if (constructor) {
            return new constructor();
        } else {
            log.warn('action type not found: ' + modelName);
        }
    }

    static getActionClass(modelName) {
        let constructor = this.getActionTypes().filter((type) => type.getModelName() === modelName)[0];
        if (constructor) {
            return constructor;
        } else {
            log.warn('action type not found: ' + modelName);
        }
    }

    static canActionClassBeTested(modelName) {
        return this.getActionClass(modelName) ? this.getActionClass(modelName).canBeTested !== false : true;
    }

    static getModelName() {
        return 'GridElement';
    }
}

GridElement.ELEMENT_TYPE_NORMAL = 'ELEMENT_TYPE_NORMAL';
GridElement.ELEMENT_TYPE_COLLECT = 'ELEMENT_TYPE_COLLECT';
GridElement.ELEMENT_TYPE_PREDICTION = 'ELEMENT_TYPE_PREDICTION';
GridElement.ELEMENT_TYPE_YT_PLAYER = 'ELEMENT_TYPE_YT_PLAYER';

GridElement.PROP_YT_PREVENT_CLICK = 'PROP_YT_PREVENT_CLICK';

export { GridElement };
