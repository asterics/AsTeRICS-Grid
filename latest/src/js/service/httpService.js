import { util } from '../util/util';
import { GridActionHTTP } from "../model/GridActionHTTP.js";
import { MainVue } from "../vue/mainVue";
import { i18nService } from "./i18nService";

let httpService = {};

httpService.doAction = async function (action) {
    try {
        log.debug(`url: ${action.restUrl}, body: ${action.body}, method: ${action.method}, contenttype: ${action.contentType}`);

        let requestOptions = {
            method: (action.method || GridActionHTTP.defaults.method),
            headers: {
                'Content-Type': (action.contentType || GridActionHTTP.defaults.contentType)
            }
        };
        if (!['GET', 'HEAD'].includes(requestOptions.method)) {
            requestOptions.body = action.body;
        }

        if (action.authUser || action.authPw) {
            let authStringBase64 = util.stringToBase64(`${action.authUser}:${action.authPw}`);
            requestOptions.headers["Authorization"] = `Basic ${authStringBase64}`;
        }

        const response = await fetch(action.restUrl, requestOptions);
        if (!response.ok) {
            MainVue.setTooltip(i18nService.t("restActionFailed", `${response.statusText} (${response.status})`), {
                revertOnClose: true,
                timeout: 5000
            });
        } else {
            log.debug(`REST call ok, url: ${action.restUrl}, body ${action.body}`)
        }
    } catch (error) {
        log.error(error);
        MainVue.setTooltip(i18nService.t("restActionFailed", error), {
            revertOnClose: true,
            timeout: 5000
        });
    }
};

export { httpService };
