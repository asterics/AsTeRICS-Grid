import { util } from './util';

let fileUtil = {};

/**
 * reads the contents of a .zip file
 * @param file the zip file to read
 * @param parseJSON if true the file content is parsed as JSON
 * @return a Promise resolving to a map {filename => String file content}
 */
fileUtil.readZip = function (file, parseJSON) {
    let returnMap = {};
    return new Promise((resolve) => {
        import('jszip').then((JSZip) => {
            JSZip.default.loadAsync(file).then((zip) => {
                let promises = [];
                Object.keys(zip.files).forEach((filename) => {
                    let file = zip.files[filename];
                    promises.push(
                        file.async('base64').then((content) => {
                            try {
                                returnMap[filename] = parseJSON ? JSON.parse(atob(content)) : content;
                            } catch (e) {
                                returnMap[filename] = content;
                            }
                        })
                    );
                });
                Promise.all(promises).then(() => {
                    resolve(returnMap);
                });
            });
        });
    });
};

/**
 * creates a .zip file based on a map of paths and file contents.
 * @param fileMap map of elements "file path" -> "file content", which define which contents should be included at
 *                which paths in the .zip file. if "file content" is not a string, it is stringified before
 *                adding it to the .zip file.
 * @return Promise which resolves to blob of created .zip file
 */
fileUtil.createZip = async function(fileMap = {}) {
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
    return zip.generateAsync({ type: 'blob' });
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

fileUtil.getFileExtension = function (file) {
    let filename = file ? file.name || '' : '';
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
};

fileUtil.isGrdFile = function (file) {
    return fileUtil.getFileExtension(file) === '.grd' || fileUtil.getFileExtension(file) === '.txt';
};

fileUtil.isObfFile = function (file) {
    return fileUtil.getFileExtension(file) === '.obf';
};

fileUtil.isObzFile = function (file) {
    return fileUtil.getFileExtension(file) === '.obz';
};

export { fileUtil };
