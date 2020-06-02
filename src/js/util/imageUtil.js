import {constants} from "./constants";

var imageUtil = {};

/**
 * returns a base64 string that represents the image of the given img-element
 * @param img the image element to convert
 * @param maxWidth maximum width of the image
 * @param quality quality of the image (0.0 - 1.0)
 * @return {string}
 */
imageUtil.getBase64FromImg = function (img, maxWidth, quality) {
    maxWidth = maxWidth || 150;
    let mimeType = img.src.indexOf('data:') === 0 ? img.src.substring(5, img.src.indexOf(';')) : null;
    mimeType = mimeType || (img.src.indexOf('.png') > -1 ? 'image/png' : null);
    mimeType = mimeType || (img.src.indexOf('.svg') > -1 ? 'image/svg+xml' : null);
    mimeType = mimeType || 'image/jpeg';

    var canvas = document.createElement("canvas");
    var factor = 1;
    if (img.width > maxWidth) {
        factor = maxWidth / img.width;
    }
    canvas.width = img.width * factor;
    canvas.height = img.height * factor;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
        let data = canvas.toDataURL(mimeType, quality);
        return data;
    } catch (e) {
        throw "image converting failed!"
    }
};

/**
 * returns promise that resolves to a base64 string that represents the content of the file
 * @param input the imput element to read the file from
 * @return {Promise}
 */
imageUtil.getBase64FromInput = function (input) {
    return new Promise(resolve => {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                resolve(e.target.result);
            };

            reader.readAsDataURL(input.files[0]);
        }
    });
};

imageUtil.convertBase64 = function (originalBase64, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        if (!originalBase64) {
            return resolve(null);
        }
        if(originalBase64.substring(5, originalBase64.indexOf(';')) === 'image/svg+xml') {
            return resolve(originalBase64);
        }
        maxWidth = maxWidth || 150;
        var img = document.createElement('img');
        img.onload = function () {
            try {
                resolve(imageUtil.getBase64FromImg(img, maxWidth, quality));
            } catch (e) {
                resolve(null);
            }
        };
        img.src = originalBase64;
    })
};

imageUtil.urlToBase64 = function (url) {
    return new Promise((resolve, reject) => {
        if (url.lastIndexOf('.svg') === url.length - 4) {
            $.get(url, null, function (svgDocument) {
                //needed because Firefox doesn't correctly handle SVG with size = 0, see https://bugzilla.mozilla.org/show_bug.cgi?id=700533
                try {
                    svgDocument.documentElement.width.baseVal.value = svgDocument.documentElement.width.baseVal.value || 500;
                    svgDocument.documentElement.height.baseVal.value = svgDocument.documentElement.height.baseVal.value || 500;
                    let base64EncodedSVG = btoa(new XMLSerializer().serializeToString(svgDocument));
                    resolve('data:image/svg+xml;base64,' + base64EncodedSVG);
                } catch (e) {
                    resolve(null);
                }
            }).fail(function () {
                resolve(null);
            });
        } else {
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                try {
                    resolve(imageUtil.getBase64FromImg(img, 1000));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = function() {
                resolve(null);
            };
            img.src = url;
        }
    });
};

imageUtil.getScreenshot = function (selector) {
    return import(/* webpackChunkName: "html2canvas" */ 'html2canvas').then(html2canvas => {
        return html2canvas.default(document.querySelector(selector), {
            scale: 0.2,
            logging: false,
            ignoreElements: (node) => {
                return constants.IS_FIREFOX && node.style['background-image'].indexOf('image/svg') !== -1;
            }
        }).then(canvas => {
            return Promise.resolve(canvas.toDataURL());
        });
    });
};

imageUtil.getEmptyImage = function () {
    return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
};

export {imageUtil};