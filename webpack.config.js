var path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = env => {
    var baseDir = '';
    var buildDir = 'app/build/';
    var buildDirLegacy = 'app/build_legacy/';
    var entryScript = './src/js/mainScript.js';
    var outputFilename = 'asterics-grid.bundle.js';
    var mode = env && env.production ? 'production' : 'development';

    var scssRule = {
        test: /\.(s*)css$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
    };

    var vueRule = {
        test: /\.vue$/,
        loader: 'vue-loader'
    };

    var babelRule = {
        test: /\.m?js$/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: [
                    ['@babel/env', {
                        modules: false,
                        useBuiltIns: false,
                        targets: {
                            browsers: [
                                '> 1%',
                                'last 2 versions',
                                'Firefox ESR',
                                'ie >= 11'
                            ],
                        },
                    }]
                ],
            },
        },
    };

    var resolve = {
        alias: {
            //objectmodel: "../../../node_modules/objectmodel/dist/object-model.js"
            vue: 'vue/dist/vue.esm.js'
        }
    };

    var externals = {
        jquery: '$',
        PouchDB: 'PouchDB'
    };

    var plugins = [new VueLoaderPlugin()];

    function log(msg) {
        if(!env || !env.nolog) {
            console.log(msg);
        }
    }

    function getDevServer(publicPath) {
        return {
            contentBase: path.resolve(__dirname),
            publicPath:  '/' + publicPath,
            host: '0.0.0.0',
            port: 9095,
            open: false,
            watchContentBase: true
        };
    }

    var configNormal = {
        mode: mode,
        entry: entryScript,
        plugins: plugins,
        output: {
            path: path.resolve(__dirname, baseDir + buildDir),
            publicPath: "./" + buildDir,
            filename: outputFilename,
            chunkFilename: '[name].bundle.js',
        },
        resolve: resolve,
        devServer: getDevServer(buildDir),
        externals: externals,
        module: {
            rules: [scssRule, vueRule]
        }
    };

    var configLegacy = {
        mode: mode,
        entry: entryScript,
        plugins: plugins,
        output: {
            path: path.resolve(__dirname, baseDir + buildDirLegacy),
            publicPath: "./" + buildDirLegacy,
            filename: outputFilename,
            chunkFilename: '[name].bundle.js',
        },
        resolve: resolve,
        devServer: getDevServer(buildDirLegacy),
        externals: externals,
        module: {
            rules: [babelRule, scssRule, vueRule],
        }
    };

    if (env.normalserver) {
        return configNormal;
    } else if (env.legacyserver) {
        return configLegacy;
    }
    return [configNormal, configLegacy];
};