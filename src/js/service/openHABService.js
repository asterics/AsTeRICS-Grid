import { util } from "../util/util";

let openHABService = {};

openHABService.fetchItems = async function (url) {
    return fetch(url + "?recursive=false").then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch items from openHAB");
        }
        return response.json();
    });
};

openHABService.sendAction = async function (action) {
    let data;
    if (action.actionType === "CUSTOM_VALUE" || action.actionType === "CUSTOM_COLOR") {
        if (action.actionType === "CUSTOM_COLOR") {
            data = hexToHSV(action);
        } else {
            data = action.actionValue;
        }
    } else {
        data = action.actionType;
    }
    await fetch(action.openHABUrl + action.itemName, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: data
    }).catch((rejection) => console.error(rejection));
};

openHABService.getRestURL = function (userUri) {
    if (!userUri) {
        userUri =
            window.location.hostname.indexOf("grid.asterics.eu") > -1
                ? "http://127.0.0.1:8080"
                : "http://" + window.location.hostname + ":8080";
    }

    if (userUri.indexOf("http") === -1) {
        userUri = "http://" + userUri;
    }

    let parser = document.createElement("a");
    parser.href = userUri;
    parser.pathname = "/rest/items/";
    if (!parser.port) {
        parser.port = 8080;
    }

    return parser.href;
};

function hexToHSV(action) {
    let rgb = util.getRGB(action.actionValue);
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    // h, s, v = hue, saturation, value
    const cmax = Math.max(r, Math.max(g, b)); // maximum of r, g, b
    const cmin = Math.min(r, Math.min(g, b)); // minimum of r, g, b
    const diff = cmax - cmin; // diff of cmax and cmin.
    let h = -1,
        s = -1;

    // if cmax and cmax are equal then h = 0
    if (cmax === cmin) h = 0;
    // if cmax equal r then compute h
    else if (cmax === r) h = (60 * ((g - b) / diff) + 360) % 360;
    // if cmax equal g then compute h
    else if (cmax === g) h = (60 * ((b - r) / diff) + 120) % 360;
    // if cmax equal b then compute h
    else if (cmax === b) h = (60 * ((r - g) / diff) + 240) % 360;

    // if cmax equal zero
    if (cmax === 0) s = 0;
    else s = (diff / cmax) * 100;

    // compute v
    var v = cmax * 100;

    return h + "," + s + "," + v;
}

export { openHABService };
