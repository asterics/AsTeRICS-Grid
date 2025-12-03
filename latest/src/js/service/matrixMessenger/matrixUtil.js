let matrixUtil = {};

// see https://github.com/element-hq/element-web/blob/a058d85c2196b5bd110611e34ebc1b66fe00a7df/src/utils/blobs.ts#L43
const ALLOWED_BLOB_MIMETYPES = [
    "image/jpeg",
    "image/gif",
    "image/png",
    "image/apng",
    "image/webp",
    "image/avif",

    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",

    "audio/mp4",
    "audio/webm",
    "audio/aac",
    "audio/mpeg",
    "audio/ogg",
    "audio/wave",
    "audio/wav",
    "audio/x-wav",
    "audio/x-pn-wav",
    "audio/flac",
    "audio/x-flac",
];

/**
 * converts a message event containing an image to a blob url that can be used within an img tag.
 * encrypted images are decrypted.
 * the blob url should be revoked using URL.revokeObjectURL(url) after img loaded (otherwise memory leak)
 * @param event
 * @param accessToken
 * @param matrixClient
 * @returns {Promise<string>} a blob url that can be used within an img tag
 */
matrixUtil.imageMessageEventToBlobUrl = async function(event, accessToken, matrixClient) {
    let url = event.getContent().url || event.getContent().file.url;
    url = matrixClient.mxcUrlToHttp(url, undefined, undefined, undefined, false, true, true);

    try {
        let rawData = await matrixUtil.fetchUrl(url, accessToken);
        let rawImageData = rawData;
        const content = event.getContent();

        if (event.getContent().file) { // image is encrypted
            const matrixEncryptAttachment = await import('matrix-encrypt-attachment');
            rawImageData = await matrixEncryptAttachment.decryptAttachment(rawData, content.file);
        }

        let mimetype = content.info.mimetype ? content.info.mimetype.split(';')[0].trim() : '';
        mimetype = getBlobSafeMimeType(mimetype);
        const blob = new Blob([rawImageData], { type: mimetype });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error('matrix: error getting blob image:', e);
    }

}

matrixUtil.fetchUrl = async function(url, accessToken) {
    try {
        let response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            log.error("matrix: error fetching media data.", response.statusCode);
            return;
        }
        return await response.arrayBuffer();

    } catch (e) {
        log.error("matrix: error fetching media data.", e);
    }
}

/**
 * ensures that the mimetype is blob-safe meaning that it cannot contain any script which is directly
 * executed if displayed by the browser (e.g. svg/xml)
 * @param mimetype
 * @returns {*|string}
 */
export function getBlobSafeMimeType(mimetype) {
    if (!ALLOWED_BLOB_MIMETYPES.includes(mimetype)) {
        return 'application/octet-stream';
    }
    return mimetype;
}

export { matrixUtil }