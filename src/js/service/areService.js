import $ from 'jquery';

var areService = {};

areService.sendDataToInputPort = function (componentId, portId, value, areURI) {
    if (!componentId || !portId || !value) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "PUT",
            beforeSend: function (request) {
                request.setRequestHeader("Content-Type", "text/plain");
            },
            url: areService.getRestURL(areURI) + "runtime/model/components/" + encodeParam(componentId) + "/ports/" + encodeParam(portId) + "/data",
            datatype: "text",
            crossDomain: true,
            data: value,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(jqXHR.responseText, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.triggerEvent = function (componentId, eventPortId, areURI) {
    if (!componentId || !eventPortId) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "PUT",
            url: areService.getRestURL(areURI) + "runtime/model/components/" + encodeParam(componentId) + "/events/" + encodeParam(eventPortId),
            datatype: "text",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(jqXHR.responseText, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getComponentIds = function (componentId, eventPortId, areURI) {
    if (!componentId || !eventPortId) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "PUT",
            url: areService.getRestURL(areURI) + "runtime/model/components/" + encodeParam(componentId) + "/events/" + encodeParam(eventPortId),
            datatype: "text",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(jqXHR.responseText, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.uploadModelBase64 = function (modelInBase64, areURI) {
    if (!modelInBase64) return;

    var modelInXML = window.atob(modelInBase64);
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "PUT",
            url: areService.getRestURL(areURI) + "runtime/model",
            contentType: "text/xml",									//content-type of the request
            data: modelInXML,
            datatype: "text",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(jqXHR.responseText, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.downloadDeployedModelBase64 = function (areURI) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "runtime/model",
            datatype: "text/xml",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(window.btoa(jqXHR.responseText), textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.startModel = function (areURI) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "PUT",
            url: areService.getRestURL(areURI) + "runtime/model/state/start",
            datatype: "text",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(jqXHR.responseText, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getModelName = function (areURI) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "runtime/model/name",
            datatype: "text",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    var name = jqXHR.responseText;
                    name = name.substring(name.lastIndexOf('\\') + 1);
                    name = name.substring(name.lastIndexOf('/') + 1);
                    if(name.indexOf('.acs') != -1) {
                        name = name.substring(0, name.indexOf('.acs') + 4);
                    }
                    resolve(name, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getRuntimeComponentIds = function (areURI) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "runtime/model/components/ids",
            datatype: "application/json",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(JSON.parse(jqXHR.responseText), textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getComponentInputPortIds = function (componentId, areURI) {
    if (!componentId) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "runtime/model/components/" + encodeParam(componentId) + "/ports/input/ids",
            datatype: "application/json",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(JSON.parse(jqXHR.responseText), textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getComponentEventChannelIds = function (componentId, areURI) {
    if (!componentId) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "runtime/model/components/" + encodeParam(componentId) + "/channels/event/ids",
            datatype: "application/json",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(JSON.parse(jqXHR.responseText), textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

/**
 * returns a valid ARE base REST URI with a given userUri entered by user
 * e.g. "localhost" -> "http://localhost:8081/rest/"
 * "192.168.1.1:9090" --> "http://192.168.1.1:9090/rest/"
 *
 * @param userUri
 * @return {*}
 */
areService.getRestURL = function (userUri) {
    if (!userUri) {
        userUri = "localhost";
    }
    if (userUri.indexOf('http') == -1) {
        userUri = 'http://' + userUri;
    }
    var parser = document.createElement('a');
    parser.href = userUri;
    parser.pathname = "/rest/";
    if (!parser.port) {
        parser.port = 8081;
    }

    return parser.href;
};

//encodes PathParametes
function encodeParam(text) {
    var encoded = "";
    for (var i = 0; i < text.length; i++) {
        encoded += text.charCodeAt(i).toString() + '-';
    }

    return encoded;
}

export {areService};