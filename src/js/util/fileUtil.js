let fileUtil = {};

/**
 * reads the contents of a .zip file
 * @param file the zip file to read
 * @param parseJSON if true the file content is parsed as JSON
 * @return a Promise resolving to a map {filename => String file content}
 */
fileUtil.readZip = function (file, parseJSON) {
    let returnMap = {};
    return new Promise(resolve => {
        import(/* webpackChunkName: "JSZip" */ 'jszip').then(JSZip => {
            JSZip.loadAsync(file).then(zip => {
                let promises = [];
                Object.keys(zip.files).forEach(filename => {
                    let file = zip.files[filename];
                    promises.push(file.async('base64').then(content => {
                        try {
                            returnMap[filename] = parseJSON ? JSON.parse(atob(content)) : content;
                        } catch (e) {
                            returnMap[filename] = content;
                        }
                    }));
                });
                Promise.all(promises).then(() => {
                    resolve(returnMap);
                });
            });
        })
    });
};

export {fileUtil};