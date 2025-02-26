import { util } from '../util/util';
import { GridActionHTTP } from "../model/GridActionHTTP.js";
import { MainVue } from "../vue/mainVue";
import { i18nService } from "./i18nService";

let httpService = {};
let MIN_PAUSE_TIME_MS = 500;
let cachePromises = {};
let lastTimes = {};

httpService.doAction = async function(action) {
    action = JSON.parse(JSON.stringify(action));
    action.id = '';
    let actionString = JSON.stringify(action);
    if (cachePromises[actionString] && new Date().getTime() - lastTimes[actionString] < MIN_PAUSE_TIME_MS) {
        return cachePromises[actionString];
    }
    cachePromises[actionString] = doActionInternal(action);
    lastTimes[actionString] = new Date().getTime();
    return cachePromises[actionString];
};

async function doActionInternal(action) {
    try {
        log.debug(`url: ${action.restUrl}, body: ${action.body}, method: ${action.method}, contenttype: ${action.contentType}`);

        let requestOptions = {
            method: (action.method || GridActionHTTP.defaults.method),
            headers: {}
        };
        if (action.acceptHeader) {
            requestOptions.headers['Accept'] = action.acceptHeader;
        }
        if (action.contentType) {
            requestOptions.headers['Content-Type'] = action.contentType;
        }
        if (!['GET', 'HEAD'].includes(requestOptions.method)) {
            requestOptions.body = action.body;
        }

        if (action.authUser || action.authPw) {
            let authStringBase64 = util.stringToBase64(`${action.authUser}:${action.authPw}`);
            requestOptions.headers["Authorization"] = `Basic ${authStringBase64}`;
        }
        requestOptions.mode = action.noCorsMode ? 'no-cors' : undefined;
        let url = new URL(action.restUrl);
        if (action.useCorsProxy) {
            url = new URL('https://proxy.asterics-foundation.org/proxy_nofilter.php');
            url.searchParams.append('csurl', action.restUrl);
        }
        const response = await fetch(url, requestOptions);
        if (!response.ok && !action.noCorsMode) {
            MainVue.setTooltip(i18nService.t("restActionFailed", `${response.statusText} (${response.status})`), {
                revertOnClose: true,
                timeout: 5000
            });
        } else {
            log.debug(`REST call ok, url: ${action.restUrl}, body ${action.body}`);
            return !action.noCorsMode ? await response.text() : '';
        }
    } catch (error) {
        log.error(error);
        MainVue.setTooltip(i18nService.t("restActionFailed", error), {
            revertOnClose: true,
            timeout: 5000
        });
    }
    return '';
}

export { httpService };
