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
 * decrypts an encrypted image event and returns a blob URL that can be used for displaying the image.
 * the blob URL should be revoked using URL.revokeObjectURL(url) after the image is displayed / loaded.
 * @param event
 * @param encryptedUrl
 * @returns {Promise<string>} the blob URL, can be directly used within an img tag
 */
matrixUtil.decryptMatrixImage = async function(event, encryptedUrl) {
    try {
        const matrixEncryptAttachment = await import('matrix-encrypt-attachment');
        const content = event.getContent();
        const response = await fetch(encryptedUrl);
        if (!response.ok) {
            log.error("matrix: error fetching encrypted media data.");
            return;
        }

        const encryptedData = await response.arrayBuffer();
        const decryptedData =  await matrixEncryptAttachment.decryptAttachment(encryptedData, content.file);

        let mimetype = content.info.mimetype ? content.info.mimetype.split(";")[0].trim() : "";
        mimetype = getBlobSafeMimeType(mimetype)
        const blob = new Blob([decryptedData], { type: mimetype });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("matrix: error decrypting image:", error);
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