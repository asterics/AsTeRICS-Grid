import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionHTTP extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    restUrl: [String],
    method: [String], // one of POST, PUT, GET,...
    contentType: [String], //REST content type
    body: [String], //The body / data of the request
    authUser: [String], //user for http authentication
    authPw: [String], //password for http authentication,
    noCorsMode: [Boolean] // if true "no-cors" mode is used for fetch, preventing errors if CORS headers not available, but endpoint functionality still works
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionHTTP);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-http');
        //this.method=GridActionREST.defaults.method;
        //this.contentType=GridActionREST.defaults.contentType;
    }

    static getModelName() {
        return 'GridActionHTTP';
    }
}

GridActionHTTP.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionHTTP.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    method: 'POST', // POST, PUT, GET,....
    contentType: 'text/plain' //text/plain, application/json
});

export { GridActionHTTP };
