import { util } from '../util/util';
import {GridActionREST} from "../model/GridActionREST";

let restService = {};

restService.doAction = async function (action) {
    try {
        let method=action.method;
        if(!method) {
            method=GridActionREST.defaults.method;
        }
        let contentType=action.contentType;
        if(contentType === '') {
            contentType=GridActionREST.defaults.contentType;
        }
        const response = await fetch(action.restUrl, {
                method: "POST", //method,
                //mode: "no-cors",
                headers: {
                    'Content-Type': "text/plain" //contentType
                },
                body: action.body
            }
        );
        if(!response.ok) {
            console.error(`REST call failed with status message (${response.statusText}), statusCode (${response.status})`);
        } else {
            log.debug(`REST call ok, url: ${action.restUrl}, body ${action.body}`)
        }
    }catch(error) {
        console.error(error);
    }
};

restService.getRestURL = function (userUri) {
    if (!userUri) {
        userUri =
            window.location.hostname.indexOf('grid.asterics.eu') > -1
                ? 'http://127.0.0.1:8080'
                : 'http://' + window.location.hostname + ':8080';
    }

    if (userUri.indexOf('http') === -1) {
        userUri = 'http://' + userUri;
    }

    let parser = document.createElement('a');
    parser.href = userUri;
    parser.pathname = '/rest/items/';
    if (!parser.port) {
        parser.port = 8080;
    }

    return parser.href;
};

export { restService };
