var path = require('path');
var buildDir = 'package/static/build';
var buildDirLegacy = 'package/static/build_legacy';
var entryScript = './src/js/mainScript.js';
var outputFilename = 'asterics-grid.bundle.js';
var mode = 'development';

var resolve = {
    alias: {
        muuri: "../../node_modules/muuri/muuri.min.js",
        hammerjs: "../../node_modules/hammerjs/hammer.min.js"
    }
};

var configNormal = {
    mode: mode,
    entry: entryScript,
    output: {
        path: path.resolve(__dirname, buildDir),
        filename: outputFilename
    },
    resolve: resolve
};

var configLegacy = {
    mode: mode,
    entry: entryScript,
    output: {
        path: path.resolve(__dirname, buildDirLegacy),
        filename: outputFilename
    },
    resolve: resolve,
    module: {
        rules: [{
            test: /\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['env', {
                            modules: false,
                            useBuiltIns: true,
                            targets: {
                                browsers: [
                                    '> 1%',
                                    'last 2 versions',
                                    'Firefox ESR'
                                ],
                            },
                        }],
                    ],
                },
            },
        }],
    }
};

module.exports = [configNormal, configLegacy];