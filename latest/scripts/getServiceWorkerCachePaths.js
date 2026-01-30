const fs = require('fs');
const path = require('path');
const namesToSkip = ['/examples/', '/gridsets/', '.LICENSE.txt'];
const namesMustInclude = ['/examples/translations/', 'gridset_metadata.json'];
const namesMustSkip = ['convertOriginalToTranslateObjects.js', '/examples/translations/original', 'app/simple', 'app/lang', 'app/dictionaries'];
let startDir = path.resolve(__dirname, '../app');
const basePath = path.resolve(__dirname, '..');   // one level above your script
const outputFile = path.resolve(__dirname, '../serviceWorkerCachePaths.js');
let printPaths = ['/', '/latest/', 'index.html'];


function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            let logPath = path.relative(basePath, fullPath).replace(/\\/g, '/');

            let mustInclude = namesMustInclude.reduce((total, current) => total || logPath.indexOf(current) !== -1, false);
            let shouldSkip = namesToSkip.reduce((total, current) => total || logPath.indexOf(current) !== -1, false);
            let mustSkip = namesMustSkip.reduce((total, current) => total || logPath.indexOf(current) !== -1, false);
            if (mustSkip || (!mustInclude && shouldSkip)) {
                return;
            }
            if (logPath.indexOf('/examples/') !== -1 && logPath.indexOf('/examples/translations/') === -1 && logPath.indexOf('default.grd.json') === -1) {
                return;
            }
            printPaths.push(logPath);
        }
    });
}

traverseDir(startDir);
console.log(printPaths);
fs.writeFileSync(outputFile, "self.URLS_TO_CACHE = " + JSON.stringify(printPaths));
