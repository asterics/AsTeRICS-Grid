var path = require('path');
var baseDir = 'package/static';
var buildDir = '/build/';
var buildDirLegacy = '/build_legacy/';
var entryScript = './src/js/mainScript.js';
var outputFilename = 'asterics-grid.bundle.js';
var mode = 'development';

var resolve = {
    alias: {
        //muuri: "../../node_modules/muuri/muuri.min.js",
        //hammerjs: "../../node_modules/hammerjs/hammer.min.js"
    }
};

var externals = {
    jquery: '$'
};

function getDevServer(buildDirParam) {
    return {
        contentBase: path.resolve(__dirname, baseDir),
        publicPath: buildDirParam,
        host: '0.0.0.0',
        port: 9090,
        open: false
    };
}

var configNormal = {
    mode: mode,
    entry: entryScript,
    output: {
        path: path.resolve(__dirname, baseDir + buildDir),
        publicPath: buildDir,
        filename: outputFilename
    },
    resolve: resolve,
    devServer: getDevServer(buildDir),
    externals: externals
};

var configLegacy = {
    mode: mode,
    entry: entryScript,
    output: {
        path: path.resolve(__dirname, baseDir + buildDirLegacy),
        publicPath: buildDirLegacy,
        filename: outputFilename
    },
    resolve: resolve,
    devServer: getDevServer(buildDirLegacy),
    externals: externals,
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