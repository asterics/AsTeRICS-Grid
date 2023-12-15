import {util} from '../util/util';
import {GridActionREST} from "../model/GridActionREST";
import {MainVue} from "../vue/mainVue";
import {i18nService} from "./i18nService";

let restService = {};

restService.doAction = async function (action) {
    try {
        log.info(`url: ${action.restUrl}, body: ${action.body}, method: ${action.method}, contenttype: ${action.contentType}`);
        let requestOptions = {
            method: (action.method || GridActionREST.defaults.method),
            //mode: "no-cors",method
            headers: {
                'Content-Type': (action.contentType || GridActionREST.defaults.contentType)
            }
        };
        if (!['GET', 'HEAD'].includes(requestOptions.method)) {
            requestOptions.body = action.body;
        }
        log.info(`requestOptions: ${requestOptions}`);
        const response = await fetch(action.restUrl, requestOptions);
        if (!response.ok) {
            log.error(`REST call failed! Status message (${response.statusText}), statusCode (${response.status})`);
            MainVue.setTooltip(i18nService.t("restActionFailed!Reason:", response.statusText), {
                revertOnClose: true,
                timeout: 5000
            });
        } else {
            //console.log(`response body: ${response.json().then()}`);
            log.debug(`REST call ok, url: ${action.restUrl}, body ${action.body}`)
        }
    } catch (error) {
        log.error(error);
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
