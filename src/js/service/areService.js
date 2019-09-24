import $ from 'jquery';

var areService = {};
var _eventSourceMap = {};
var _sseReconnectTimeoutHandler = null;
var _sseWasSuccess = false;

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

areService.getRuntimeComponentIds = function(areURI) {
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

areService.uploadModelBase64 = function (modelInBase64, areURI) {

    return new Promise((resolve, reject) => {
        if (!modelInBase64) {
            reject();
            return;
        }
        $.ajax({
            type: "PUT",
            url: areService.getRestURL(areURI) + "runtime/model",
            contentType: "text/xml",									//content-type of the request
            data: window.atob(modelInBase64),
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

/**
 * uploads and starts a model. if modelName is defined the given base64 model is only uploaded if the currently
 * deployed model has a different name.
 * In any case the model is started.
 *
 * @param modelInBase64
 * @param areURI
 * @param modelName
 * @return {Promise}
 */
areService.uploadAndStartModel = function (modelInBase64, areURI, modelName) {
    return new Promise((resolve, reject) => {
        areService.getModelName(areURI).then(name => {
            if(name !== modelName) {
                areService.uploadModelBase64(modelInBase64, areURI).then(() => {
                    areService.startModel(areURI).then(() => {
                        resolve();
                    });
                });
            } else {
                areService.startModel(areURI).then(() => {
                    resolve();
                });
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
    return new Promise((resolve, reject) => {
        if (!componentId) {
            resolve([]);
            return;
        }
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

areService.getComponentEventPortIds = function (componentId, areURI) {
    return new Promise((resolve, reject) => {
        if (!componentId) {
            resolve([]);
            return;
        }
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
 * e.g. "localhost" -> "http://127.0.0.1:8081/rest/"
 * "192.168.1.1:9090" --> "http://192.168.1.1:9090/rest/"
 *
 * @param userUri
 * @return {*}
 */
areService.getRestURL = function (userUri) {
    if (!userUri) {
        userUri = window.location.hostname.indexOf('grid.asterics.eu') > -1 ? "http://127.0.0.1:8081" : "http://" + window.location.hostname + ":8081";
    }
    if (userUri.indexOf('http') === -1) {
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

areService.getTypeId = function (componentId, modelBase64) {
    let xml = window.atob(modelBase64);
    return $(xml).find('components component[id="' + componentId + '"]').attr('type_id');
};

areService.getComponentDescriptorsAsXml = function(areURI) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: areService.getRestURL(areURI) + "storage/components/descriptors/xml",
            datatype: "text/xml",
            crossDomain: true,
            success:
                function (data, textStatus, jqXHR) {
                    resolve(data, textStatus);
                },
            error:
                function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown, jqXHR.responseText);
                }
        });
    });
};

areService.getPossibleEvents = function(componentId, modelBase64, areURI) {
    return new Promise(resolve => {
        areService.getComponentDescriptorsAsXml(areURI).then(descriptorsXml => {
            let typeId = areService.getTypeId(componentId, modelBase64);
            let events = $(descriptorsXml).find('componentType[id="' + typeId + '"] eventListenerPort').map(function() { return this.id; }).get();
            resolve(events);
        });
    });
};

areService.subscribeEvents = function(areURI, eventCallback, errorCallback) {
    if ((typeof EventSource) === "undefined") {
        log.warn("SSE not supported by browser");
        return;
    }

    let areUrl = areService.getRestURL(areURI);
    if (!_eventSourceMap[areUrl]) {
        _eventSourceMap[areUrl] = new EventSource(areUrl + 'runtime/model/channels/event/listener'); // Connecting to SSE service for event channel events

        // After SSE handshake constructed
        _eventSourceMap[areUrl].onopen = function (e) {
            log.debug('SSE opened.');
            _sseWasSuccess = true;
        };

        // Error handler
        _eventSourceMap[areUrl].onerror = function (e) {
            closeEventSource(areUrl);
            if (errorCallback) {
                errorCallback(e);
            }

            if (_sseWasSuccess) {
                log.info('SSE error occured, trying to reconnect in 10 seconds...');
                _sseReconnectTimeoutHandler = setTimeout(function () {
                    _sseReconnectTimeoutHandler = null;
                    areService.subscribeEvents(areURI, eventCallback, errorCallback);
                }, 3000);
            }
        };
    }

    //adding listener for specific events
    _eventSourceMap[areUrl].addEventListener("event", function(e) {
        eventCallback(e.data, 200);
    }, false);
};

areService.unsubscribeEvents = function (areUrl) {
    if (_sseReconnectTimeoutHandler) {
        clearTimeout(_sseReconnectTimeoutHandler);
    }
    _sseWasSuccess = false;
    if (areUrl) {
        closeEventSource(areUrl);
    } else {
        Object.keys(_eventSourceMap).forEach(areUrl => {
            closeEventSource(areUrl);
        });
    }
};

function closeEventSource(areUrl) {
    if (_eventSourceMap[areUrl] !== null) {
        _eventSourceMap[areUrl].close();
        _eventSourceMap[areUrl] = null;
        log.debug('SSE closed.');
    }
}

//encodes PathParametes
function encodeParam(text) {
    var encoded = "";
    for (var i = 0; i < text.length; i++) {
        encoded += text.charCodeAt(i).toString() + '-';
    }

    return encoded;
}

export {areService};