import { util } from '../util/util';
import { GridActionREST } from "../model/GridActionREST";
import { MainVue } from "../vue/mainVue";
import { i18nService } from "./i18nService";

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
        log.info(`requestOptions: ${Object.values(requestOptions)}`);

        //action.authUser = "admin";
        //action.authPw = "mad";
        if (action.authUser || action.authPw) {
            let authStringBase64 = util.stringToBase64(`${action.authUser}:${action.authPw}`);
            requestOptions.Authorization = `Basic ${authStringBase64}`;
        }

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

export { restService };
