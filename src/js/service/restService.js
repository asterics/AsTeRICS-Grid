import { util } from '../util/util';
import {GridActionREST} from "../model/GridActionREST";

let restService = {};

restService.doAction = async function (action) {
    try {
        //ensure to have default values also in case the user deletes the field contents
        let method=action.method;
        if(!method) {
            method=GridActionREST.defaults.method;
        }

        let contentType=action.contentType;
        if(contentType === '') {
            contentType=GridActionREST.defaults.contentType;
        }

        //as method GET does not have a body, conditionally set the body variable
        let body;
        if(method!='GET') {
            body=action.body;
        }

        console.log(`url: ${action.restUrl}, body: ${body}, method: ${method}, contenttype: ${contentType}`);
        const response = await fetch(action.restUrl, {
                method: method,
                //mode: "no-cors",
                headers: {
                    'Content-Type': contentType
                },
                body: body
            }
        );
        if(!response.ok) {
            console.error(`REST call failed with status message (${response.statusText}), statusCode (${response.status})`);
        } else {
            //console.log(`response body: ${response.json().then()}`);
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
