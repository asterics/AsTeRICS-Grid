import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionHttpRequest extends Model({
    id: String,
    modelName: String,
    modelVersion: String, 

    /* Dynamically rows
   parameters: [{
        keyParameter: '',
        valueParameter: ''
        }],
    */    
    keyParameter: [String],
    valueParameter: [String],

    urlRequest: [String],
    format: [String],
    bodyData: [String],  
    method: [String]

}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionHttpRequest);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-http-request')
        // this.id = this.id || modelUtil.generateId(GridActionOpenWebpage.getModelName())  /
    }

    static getModelName() {
        return "GridActionHttpRequest";
    }

    /* Functions for Dynamically rows
    
    // add row bei http Request - "Parameters"
    static addRow () {      
       this.parameters.push({keyParameter:'', valueParameter: ''})
    }

    //delete row bei http Request - "Parameters"
    static deleteRow(index) {    
        this.parameters.splice(index,1);             
    }    
   */

}

GridActionHttpRequest.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionHttpRequest.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionHttpRequest};