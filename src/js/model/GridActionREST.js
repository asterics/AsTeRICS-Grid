import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionREST extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    restUrl: [String],
    method: [String], // one of POST, PUT, GET,...
    contentType: [String], //REST content type
    body: [String] //The body / data of the request
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionREST);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-rest');
        //this.method=GridActionREST.defaults.method;
        //this.contentType=GridActionREST.defaults.contentType;
    }

    static getModelName() {
        return 'GridActionREST';
    }
}

GridActionREST.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionREST.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    restUrl: '',
    method: '', // POST, PUT, GET,....
    contentType: '', //text/plain, application/json
    body: '' //The body / data of the request

});

export { GridActionREST };
