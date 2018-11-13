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
    var canvas = document.createElement("canvas");
    var factor = 1;
    if (img.width > maxWidth) {
        factor = maxWidth / img.width;
    }
    canvas.width = img.width * factor;
    canvas.height = img.height * factor;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
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
    return new Promise(resolve => {
        if(!originalBase64) {
            resolve(null);
            return;
        }
        maxWidth = maxWidth || 150;
        var img = document.createElement('img');
        img.onload = function () {
            resolve(imageUtil.getBase64FromImg(img, maxWidth, quality));
        };
        img.src = originalBase64;
    })
};

export {imageUtil};