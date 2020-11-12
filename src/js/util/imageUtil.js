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

/**
 * converts a base64 encoded data url SVG image to a PNG image
 * @param originalBase64 data url of svg image
 * @param width target width in pixel of PNG image
 * @param secondTry used internally to prevent endless recursion
 * @return {Promise<unknown>} resolves to png data url of the image
 */
imageUtil.base64SvgToBase64Png = function (originalBase64, width, secondTry) {
    return new Promise(resolve => {
        let img = document.createElement('img');
        img.onload = function () {
            if (!secondTry && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                let svgDoc = base64ToSvgDocument(originalBase64);
                let fixedDoc = fixSvgDocumentFF(svgDoc);
                return imageUtil.base64SvgToBase64Png(svgDocumentToBase64(fixedDoc), width, true).then(result => {
                    resolve(result);
                });
            }
            let dim = imageUtil.getImageDimensionsFromImg(img);
            let ratio = dim.ratio || 1;
            let canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = width / ratio;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
                let data = canvas.toDataURL('image/png');
                resolve(data);
            } catch (e) {
                resolve(null);
            }
        };
        img.src = originalBase64;
    });
}

imageUtil.urlToBase64 = function (url) {
    return new Promise((resolve, reject) => {
        if (url.lastIndexOf('.svg') === url.length - 4) {
            $.get(url, null, function (svgDocument) {
                let fixedSvg = fixSvgDocumentFF(svgDocument);
                resolve(svgDocumentToBase64(fixedSvg));
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

/**
 * gets the dimensions of an image based on a given data URL
 * @param dataUrl
 * @return {Promise<{width: number, height: number, ratio: number}>|Promise<{}>}
 */
imageUtil.getImageDimensionsFromDataUrl = function (dataUrl) {
    if (!dataUrl) {
        return Promise.resolve({});
    }
    return new Promise(resolve => {
        let img = new Image();
        img.onload = function () {
            resolve(imageUtil.getImageDimensionsFromImg(img));
        };
        img.src = dataUrl;
    });
}

/**
 * gets the dimensions of an image based on a given Image object
 * @param img
 * @return {{}|{width: number, height: number, ratio: number}}
 */
imageUtil.getImageDimensionsFromImg = function (img) {
    if (!img) {
        return {}
    }
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width === 0 || height === 0) {
        document.body.appendChild(img);
        width = img.clientWidth;
        height = img.clientHeight;
        document.body.removeChild(img);
    }
    return {
        width: width,
        height: height,
        ratio: width / height
    };
}

//needed because Firefox doesn't correctly handle SVG with size = 0, see https://bugzilla.mozilla.org/show_bug.cgi?id=700533
function fixSvgDocumentFF(svgDocument) {
    try {
        let widthInt = parseInt(svgDocument.documentElement.width.baseVal.value) || 500;
        let heightInt = parseInt(svgDocument.documentElement.height.baseVal.value) || 500;
        svgDocument.documentElement.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, widthInt);
        svgDocument.documentElement.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, heightInt);
        return svgDocument;
    } catch (e) {
        return svgDocument;
    }
}

function svgDocumentToBase64(svgDocument) {
    try {
        let base64EncodedSVG = btoa(new XMLSerializer().serializeToString(svgDocument));
        return 'data:image/svg+xml;base64,' + base64EncodedSVG;
    } catch (e) {
        return null;
    }
}

function base64ToSvgDocument(base64) {
    let svg = atob(base64.substring(base64.indexOf('base64,') + 7));
    svg = svg.substring(svg.indexOf('<svg'));
    let parser = new DOMParser();
    return parser.parseFromString(svg, "image/svg+xml");
}

export {imageUtil};