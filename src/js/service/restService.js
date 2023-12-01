import {util} from '../util/util';
import {GridActionREST} from "../model/GridActionREST";
import {MainVue} from "../vue/mainVue";
import {i18nService} from "./i18nService";

let restService = {};

restService.doAction = async function (action) {
    try {
        //ensure to have default values also in case the user deletes the field contents
        let method = action.method;
        if (!method) {
            method = GridActionREST.defaults.method;
        }

        let contentType = action.contentType;
        if (contentType === '') {
            contentType = GridActionREST.defaults.contentType;
        }

        //as method GET does not have a body, conditionally set the body variable
        let body;
        if (method != 'GET') {
            body = action.body;
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
        if (!response.ok) {
            console.error(`REST call failed! Status message (${response.statusText}), statusCode (${response.status})`);
            MainVue.setTooltip(i18nService.t("restActionFailed!Reason:", response.statusText), {
                revertOnClose: true,
                timeout: 5000
            });
        } else {
            //console.log(`response body: ${response.json().then()}`);
            log.debug(`REST call ok, url: ${action.restUrl}, body ${action.body}`)
        }
    } catch (error) {
        console.error(error);
        MainVue.setTooltip(i18nService.t("restActionFailed!Reason:", error), {
            revertOnClose: true,
            timeout: 5000
        });
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

export {restService};
