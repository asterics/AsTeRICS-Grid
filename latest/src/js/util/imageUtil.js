import {constants} from "./constants";

var imageUtil = {};

/**
 * returns a base64 string that represents the image of the given img-element
 * @param img the image element to convert
 * @param maxWidth maximum width of the image
 * @param quality quality of the image (0.0 - 1.0)
 * @param mimeType the mime type to use for output
 * @return {Object} object containing "data" base64 data of image, "dim" containing width, height and ratio
 */
imageUtil.getBase64FromImg = function (img, maxWidth, quality, mimeType) {
    maxWidth = maxWidth || 150;
    mimeType = mimeType || imageUtil.getMimeTypeFromBase64(img.src);
    mimeType = mimeType || (img.src.indexOf('.png') > -1 ? constants.MIME_TYPE_PNG : null);
    mimeType = mimeType || (img.src.indexOf('.svg') > -1 ? constants.MIME_TYPE_SVG : null);
    mimeType = mimeType || constants.MIME_TYPE_JPEG;

    let canvas = document.createElement('canvas');
    let factor = 1;
    if (img.width > maxWidth) {
        factor = maxWidth / img.width;
    }
    canvas.width = img.width * factor;
    canvas.height = img.height * factor;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
        let data = canvas.toDataURL(mimeType, quality);
        return {
            data: data,
            dim: getDimObject(canvas.width, canvas.height)
        };
    } catch (e) {
        console.warn('image converting failed!', e);
        return null;
    }
};

/**
 * compresses a given base64 image to a target size
 * @param originalBase64
 * @param maxWidth max width of the image in pixels
 * @param maxSizeKB max size of the resulting base64 string in kB
 * @param initialQuality
 * @return {Promise<unknown>} promise which resolves in a compressed base64 image string. if compression not successful
 *                            the promise is rejected
 */
imageUtil.compressToSize = async function (originalBase64, maxWidth = 150, maxSizeKB = null, initialQuality = 0.9) {
    maxSizeKB = maxSizeKB || constants.MAX_BASE64_IMAGE_SIZE_KB;
    const maxSizeBytes = maxSizeKB * 1024;

    if (!originalBase64) {
        return Promise.reject();
    }
    if (originalBase64.length < maxSizeBytes) {
        return originalBase64;
    }

    let mimeType = imageUtil.getMimeTypeFromBase64(originalBase64);

    if (mimeType === constants.MIME_TYPE_SVG) {
        // if svg is too big, convert it to png and then try to compress the png
        originalBase64 = await imageUtil.base64SvgToBase64Png(originalBase64, maxWidth);
        mimeType = constants.MIME_TYPE_PNG;
    }

    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = function () {
            try {
                const resultData = imageUtil.compressImg(img, mimeType, maxSizeBytes, maxWidth, initialQuality);

                // Return the compressed version only if it actually ended up smaller than the original
                const final = (resultData && resultData.length < originalBase64.length) ? resultData : originalBase64;

                if (final.length > maxSizeBytes) {
                    return reject(new Error("Image could not be compressed below the target size limit."));
                }

                return resolve(final);
            } catch (e) {
                console.error("Compression error:", e);
                return reject(e);
            }
        };

        img.onerror = function () {
            return reject(new Error("Failed to load image source."));
        };

        img.src = originalBase64;
    });
};

/**
 * compresses an image given as existing img element, handles both png and jpeg
 * @param img
 * @param mimeType
 * @param maxSizeBytes
 * @param maxWidth
 * @param initialQuality
 * @return the compressed base64 data
 */
imageUtil.compressImg = function (img, mimeType, maxSizeBytes, maxWidth, initialQuality) {
    let resultData = null;
    let currentSizeBytes = Infinity;
    let quality = initialQuality || 0.9;
    let currentWidth = maxWidth;

    while (currentSizeBytes > maxSizeBytes) {
        // Generate the base64 output dynamically using the format's current state
        let result = imageUtil.getBase64FromImg(img, currentWidth, quality, mimeType);
        if (!result || !result.data) {
            break;
        }

        resultData = result.data;
        currentSizeBytes = resultData.length;

        // If target size is met, break immediately
        if (currentSizeBytes <= maxSizeBytes) {
            break;
        }

        // Apply format-specific reduction strategies
        if (mimeType === constants.MIME_TYPE_JPEG) {
            quality -= 0.05;
            if (quality <= 0.01) break;
        } else {
            // PNG ignores quality; we must step down dimensions by 15% each iteration
            currentWidth = Math.floor(currentWidth * 0.85);
            if (currentWidth < 20) break;
        }
    }

    return resultData;
};

/**
 * returns the correct file suffix for a given data string
 * @param dataString
 * @return {string}
 */
imageUtil.dataStringToFileSuffix = function(dataString = '') {
    if (dataString.startsWith('data:image/png')) {
        return 'png';
    }
    if (dataString.startsWith('data:image/svg')) {
        return 'svg';
    }
    if (dataString.startsWith('data:image/jpeg')) {
        return 'jpg';
    }
    return '';
};

imageUtil.mimeTypeToFileSuffix = function getImageExtension(mimeType) {
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
        'image/svg': 'svg'
    };

    return mimeMap[mimeType] || '';
}

/**
 * returns the mime type for a given base64 image
 * @param base64Image
 * @return {string|null} mime type like e.g. "image/png" or null if no valid base64 was given
 */
imageUtil.getMimeTypeFromBase64 = function (base64Image) {
    let dataPrefix = 'data:';
    if (typeof base64Image !== 'string' || !base64Image.startsWith(dataPrefix)) {
        return null;
    }

    const semicolonIndex = base64Image.indexOf(';');
    if (semicolonIndex === -1) {
        return null;
    }

    return base64Image.substring(dataPrefix.length, semicolonIndex);
};

/**
 * returns promise that resolves to a base64 string that represents the content of the file
 * @param input the imput element to read the file from
 * @return {Promise}
 */
imageUtil.getBase64FromInput = function (input) {
    return new Promise((resolve) => {
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
        if (originalBase64.substring(5, originalBase64.indexOf(';')) === 'image/svg+xml') {
            return resolve(originalBase64);
        }
        maxWidth = maxWidth || 150;
        var img = document.createElement('img');
        img.onload = function () {
            try {
                resolve(imageUtil.getBase64FromImg(img, maxWidth, quality).data);
            } catch (e) {
                resolve(null);
            }
        };
        img.src = originalBase64;
    });
};

/**
 * converts a base64 encoded data url SVG image to a base64 image
 * @param originalBase64 data url of svg image
 * @param width target width in pixel of output image
 * @param targetMimeType target mime type of the conversion
 * @param whiteBg use white background instead of transparent one?
 * @param secondTry used internally to prevent endless recursion
 * @return {Promise<unknown>} resolves to png data url of the image
 */
imageUtil.convertBase64Svg = function (originalBase64, width = 300, targetMimeType = "image/png", whiteBg = false, secondTry = false) {
    if (!originalBase64) {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        let img = document.createElement('img');
        img.onload = function () {
            if (!secondTry && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                let svgDoc = base64ToSvgDocument(originalBase64);
                let fixedDoc = fixSvgDocumentFF(svgDoc);
                return imageUtil.convertBase64Svg(svgDocumentToBase64(fixedDoc), width, targetMimeType, whiteBg, true).then((result) => {
                    resolve(result);
                });
            }
            let dim = imageUtil.getImageDimensionsFromImg(img);
            let ratio = dim.ratio || 1;
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = width / ratio;
            let ctx = canvas.getContext('2d');
            if (whiteBg) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
                let data = canvas.toDataURL(targetMimeType);
                resolve(data);
            } catch (e) {
                resolve(null);
            }
        };
        img.src = originalBase64;
    });
};

imageUtil.base64SvgToBase64Png = function(originalBase64, width) {
    return imageUtil.convertBase64Svg(originalBase64, width, constants.MIME_TYPE_PNG);
}

imageUtil.base64SvgToBase64Jpeg = function(originalBase64, width) {
    return imageUtil.convertBase64Svg(originalBase64, width, constants.MIME_TYPE_JPEG, true);
}

/**
 * converts a given url to a base64 data and also returns image dimensions
 * @param url url of the image
 * @param maxWidth
 * @param mimeType
 * @return {Promise<Object>} object containing keys "data" (base64) and "dim" with keys width, height and ratio
 */
imageUtil.urlToBase64WithDimensions = function (url, maxWidth, mimeType) {
    maxWidth = maxWidth || 500;
    return new Promise((resolve, reject) => {
        if (url.lastIndexOf('.svg') === url.length - 4) {
            $.get(url, null, function (svgDocument) {
                let fixedSvg = fixSvgDocumentFF(svgDocument);
                resolve({
                    data: svgDocumentToBase64(fixedSvg),
                    dim: getSvgDim(fixedSvg)
                });
            }).fail(function () {
                resolve(null);
            });
        } else {
            let img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                try {
                    resolve(imageUtil.getBase64FromImg(img, maxWidth, undefined, mimeType));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = function () {
                resolve(null);
            };
            img.src = url;
        }
    });
};

imageUtil.urlToBase64 = function (url, maxWidth, mimeType) {
    return imageUtil.urlToBase64WithDimensions(url, maxWidth, mimeType).then((dataWithDim) => {
        return Promise.resolve(dataWithDim ? dataWithDim.data : null);
    });
};

/**
 * @param selector
 * @param options
 * @param options.ignoreSVG if true, SVG images are ignored
 * @param options.scale scale of the image (0.1 to 2.0 recommended), defaults to 0.2
 * @param options.quality image quality (0 to 1), defaults to 0.6
 * @param options.mimeType "image/webp" (default), "image/png", or "image/jpeg"
 * @param options.returnCanvas if true, returns the HTMLCanvasElement
 * @param options.bgColor custom background color to use for the screenshot
 * @returns {Promise<*>} the screenshot data, null if there was no element for the given selector
 */
imageUtil.getScreenshot = async function (selector, options = {}) {
    const element = document.querySelector(selector);
    if (!element) return null;

    if (!options.bgColor) {
        // 1. Get the "real" background color of the element
        const computedStyle = window.getComputedStyle(element);
        options.bgColor = computedStyle.backgroundColor;

        // 2. If the background is transparent (rgba(0,0,0,0)), default to white
        if (options.bgColor === 'rgba(0, 0, 0, 0)' || options.bgColor === constants.colors.TRANSPARENT) {
            options.bgColor = '#ffffff';
        }
    }

    const htmlToImage = await import(/* webpackChunkName: "html-to-image" */ 'html-to-image');
    const config = {
        quality: options.quality || 0.6,
        pixelRatio: options.scale || 0.2,
        cacheBust: false,
        includeQueryParams: true,
        skipFonts: true,
        backgroundColor: options.bgColor,
        filter: (node) => {
            if (options.ignoreSVG) {
                // Ignore SVG <img> tags
                if (node.tagName === 'IMG' && node.src && node.src.endsWith('.svg')) return false;
                // Ignore background SVGs
                if (node.style && node.style['background-image'] && node.style['background-image'].includes('image/svg')) return false;
            }

            // filter out all image with no 'crossorigin' attribute
            // reason: no CORS headers, cannot be used on screenshots
            if (node.tagName === 'IMG') {
                const isRemote = node.src && node.src.startsWith('http');
                const hasCrossOrigin = node.hasAttribute('crossorigin');
                if (isRemote && !hasCrossOrigin) {
                    return false;
                }
            }
            return true;
        }
    };

    try {
        await htmlToImage.toCanvas(element, config); // "warm up" - prevents missing images on iOS, see https://github.com/asterics/Asterics-AAC/issues/773
        const canvas = await htmlToImage.toCanvas(element, config);
        if (options.returnCanvas) {
            return canvas;
        }

        const type = options.mimeType || 'image/webp';
        const quality = options.quality || 0.6;

        return canvas.toDataURL(type, quality);
    } catch (e) {
        log.warn('Screenshot failed with html-to-image, retrying without SVGs...', e);
        if (options.ignoreSVG) {
            return imageUtil.getEmptyImage();
        } else {
            return imageUtil.getScreenshot(selector, { ...options, ignoreSVG: true });
        }
    }
};

imageUtil.canvasToBlob = function(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob));
    });
};

imageUtil.getEmptyImage = function () {
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
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
    return new Promise((resolve) => {
        let img = new Image();
        img.onload = function () {
            resolve(imageUtil.getImageDimensionsFromImg(img));
        };
        img.src = dataUrl;
    });
};

/**
 * gets the dimensions of an image based on a given Image object
 * @param img
 * @return {{}|{width: number, height: number, ratio: number}}
 */
imageUtil.getImageDimensionsFromImg = function (img) {
    if (!img) {
        return {};
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
};

imageUtil.allImagesLoaded = function () {
    // https://stackoverflow.com/a/60949881/9219743
    return Promise.all(
        Array.from(document.images).map((img) => {
            if (img.complete) return Promise.resolve(img.naturalHeight !== 0);
            return new Promise((resolve) => {
                img.addEventListener('load', () => resolve(true));
                img.addEventListener('error', (error) => resolve(false));
                setTimeout(() => {
                    resolve(false);
                }, 2000);
            });
        })
    ).then((results) => {
        if (results.every((res) => res)) {
            // all images loaded successfully
            return Promise.resolve(true);
        } else {
            // some images failed to load, all finished loading
            return Promise.resolve(false);
        }
    });
};

imageUtil.dataStringToBase64 = function(dataString = "") {
    return dataString.substring(dataString.indexOf('base64,') + 7);
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

function getSvgDim(svgDocument) {
    try {
        let widthInt = parseInt(svgDocument.documentElement.width.baseVal.value) || 500;
        let heightInt = parseInt(svgDocument.documentElement.height.baseVal.value) || 500;
        return getDimObject(widthInt, heightInt);
    } catch (e) {
        return getDimObject(0, 0);
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
    let svg = atob(imageUtil.dataStringToBase64(base64));
    svg = svg.substring(svg.indexOf('<svg'));
    let parser = new DOMParser();
    return parser.parseFromString(svg, 'image/svg+xml');
}

function getDimObject(width, height) {
    return {
        width: width,
        height: height,
        ratio: width / height
    };
}

export { imageUtil };
