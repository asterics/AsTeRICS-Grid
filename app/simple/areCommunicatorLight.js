//The base URI that ARE runs at
var _baseURI = "http://" + window.location.hostname + ":8081/rest/";

//encodes PathParametes
function encodeParam(text) {
    var encoded = "";
    for (var i = 0; i < text.length; i++) {
        encoded += text.charCodeAt(i).toString() + '-';
    }

    return encoded;
}

function getData(filepath, successCallback, errorCallback) {
    if (!filepath) return;

    var url = "http://" + window.location.hostname + ":8081/" + filepath;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) {
                successCallback(xmlHttp.responseText);
            } else {
                errorCallback();
            }
        }
    };
    xmlHttp.open("GET", url);
    xmlHttp.send();
}

function sendDataToInputPort(componentId, portId, value) {
    if (!componentId || !portId || !value) return;

    //use GET sendDataToInputPort() for legacy reasons (phones that do only support GET requests)
    var url = _baseURI + "runtime/model/components/" + encodeParam(componentId) + "/ports/" + encodeParam(portId) + "/data/" + encodeParam(value);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url); // false for synchronous request
    xmlHttp.send(value);
}