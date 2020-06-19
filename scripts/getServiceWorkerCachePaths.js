const fs = require('fs');
const path = require('path');
const namesToSkip = ['/examples/'];
const namesMustInclude = ['default.grd.json', '/examples/translations/'];
const namesMustSkip = ['convertOriginalToTranslateObjects.js', '/examples/translations/original', 'app/simple'];
let startDir = "../app/";
let cutFromStartPath = "..";
let printPaths = ['/', '/index.html'];


function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            let logPath = fullPath.split('\\').join('/');
            logPath = logPath.substring(logPath.indexOf(cutFromStartPath) + cutFromStartPath.length);

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
fs.writeFileSync('serviceWorkerPaths.txt', JSON.stringify(printPaths));
