import { util } from './util';

let fileUtil = {};

/**
 * reads the contents of a .zip file
 * @param file the zip file to read
 * @param options
 * @param options.jsonFileExtensions array of file extensions that should be parsed as json (without dot, e.g. "json", "obf")
 * @param options.defaultEncoding default file content encoding, see https://stuk.github.io/jszip/documentation/api_zipobject/async.html
 * @param options.progressFn function that is called with current progress in percent
 * @return a Promise resolving to a map {filename => file content}
 */
fileUtil.readZip = async function(file, options = {}) {
    options.jsonFileExtensions = options.jsonFileExtensions || [];
    options.progressFn = options.progressFn || (() => {});
    let returnMap = {};
    const JSZipImport = await import('jszip');
    const JSZip = JSZipImport.default;
    let zip = await JSZip.loadAsync(file);
    let promises = [];
    let filenames = Object.keys(zip.files);
    let readCount = 0;
    for (let filename of filenames) {
        let file = zip.files[filename];
        let type = options.defaultEncoding || 'base64';
        let parseJson = options.jsonFileExtensions.some(ext => filename.endsWith(`.${ext}`));
        type = parseJson ? 'binarystring' : type;
        promises.push(Promise.resolve().then(async () => {
            let content = await file.async(type);
            readCount++;
            options.progressFn((readCount / filenames.length) * 100);
            if (parseJson) {
                try {
                    content = JSON.parse(content);
                } catch (e) {
                    log.warn('couldn\'t parse json from zip!', filename);
                    content = null;
                }
            }
            returnMap[filename] = content;
        }));
    }
    await Promise.all(promises);
    return returnMap;
};

/**
 * creates a .zip file based on a map of paths and file contents.
 * @param fileMap map of elements "file path" -> "file content", which define which contents should be included at
 *                which paths in the .zip file. if "file content" is not a string, it is stringified before
 *                adding it to the .zip file.
 * @param options
 * @param options.progressFn function that is called with current progress in percent
 * @return Promise which resolves to blob of created .zip file
 */
fileUtil.createZip = async function(fileMap = {}, options = {}) {
    options.progressFn = options.progressFn || (() => {});
    const JSZipImport = await import('jszip');
    const JSZip = JSZipImport.default;
    let zip = new JSZip();
    for (let path of Object.keys(fileMap)) {
        let content = fileMap[path];
        if (!util.isString(content) && !ArrayBuffer.isView(content)) {
            content = JSON.stringify(content);
        }
        zip.file(path, content, {binary: true}); //binary: true, in order to keep special chars correctly
    }
    return zip.generateAsync({ type: 'blob' }, (metadata) => {
        options.progressFn(metadata.percent);
    });
}

fileUtil.readFileContent = function (file) {
    if (!file) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            resolve(evt.target.result);
        };
        reader.onerror = (evt) => {
            log.warn('error reading file');
            resolve(evt.target.result);
        };
        reader.readAsText(file, 'UTF-8');
    });
};

fileUtil.getFilename = function(file) {
    return file && file.name ? (file.name || '') : (file || '');
}

fileUtil.getFileExtension = function (file) {
    let filename = fileUtil.getFilename(file);
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
};

fileUtil.isGrdFile = function (file) {
    let filename = fileUtil.getFilename(file);
    return fileUtil.getFileExtension(file) === '.grd' || fileUtil.getFileExtension(file) === '.txt' || filename.endsWith('.grd.json');
};

fileUtil.isObfFile = function (file) {
    return fileUtil.getFileExtension(file) === '.obf';
};

fileUtil.isObzFile = function (file) {
    return fileUtil.getFileExtension(file) === '.obz' || fileUtil.getFileExtension(file) === '.zip';
};

/**
 * downloads JSON or binary data from a given URL
 * @param url
 * @param options
 * @param options.isBytes if true, bytes should be downloaded, otherwise json
 * @returns {Promise<unknown>}
 */
fileUtil.downloadFile = function(url, options = {}) {
    return new Promise((resolve) => {
        $.ajax({
            url: url,
            method: 'GET',
            xhrFields: options.isBytes ? { responseType: 'blob' } : {}, // Binary response if required
            dataType: !options.isBytes ? 'json' : undefined // JSON type for non-binary
        })
            .done((data) => {
                resolve(data);
            })
            .fail((xhr, status, error) => {
                console.warn(`Download failed: ${error}`);
                resolve(null);
            });
    });
}

export { fileUtil };
