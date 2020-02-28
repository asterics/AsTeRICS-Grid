var path = require('path');
const AppCachePlugin = require('appcache-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
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
                    }],
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
    var appcachePlugin = new AppCachePlugin({
        cache: [
            '../index.html',
            'index.html',
            'build/asterics-grid.bundle.js',
            'build_legacy/asterics-grid.bundle.js',
            'css/fontawesome/css/all.css',
            'css/fontawesome/webfonts/fa-brands-400.eot',
            'css/fontawesome/webfonts/fa-brands-400.svg',
            'css/fontawesome/webfonts/fa-brands-400.ttf',
            'css/fontawesome/webfonts/fa-brands-400.woff',
            'css/fontawesome/webfonts/fa-brands-400.woff2',
            'css/fontawesome/webfonts/fa-regular-400.eot',
            'css/fontawesome/webfonts/fa-regular-400.svg',
            'css/fontawesome/webfonts/fa-regular-400.ttf',
            'css/fontawesome/webfonts/fa-regular-400.woff',
            'css/fontawesome/webfonts/fa-regular-400.woff2',
            'css/fontawesome/webfonts/fa-solid-900.eot',
            'css/fontawesome/webfonts/fa-solid-900.svg',
            'css/fontawesome/webfonts/fa-solid-900.ttf',
            'css/fontawesome/webfonts/fa-solid-900.woff',
            'css/fontawesome/webfonts/fa-solid-900.woff2',
            'css/jquery-ui.css',
            'css/images/ui-icons_444444_256x240.png',
            'css/custom.css',
            'css/skeleton.css',
            'img/asterics-grid-icon.png',
            'img/asterics_icon.png',
            'img/favicon.ico',
            'lib/dom-i18n.min.js',
            'lib/gridList.js',
            'lib/jquery.contextMenu.min.js',
            'lib/jquery.gridList.js',
            'lib/jquery.min.js',
            'lib/jquery.ui.position.min.js',
            'lib/jquery.ui.touchpunch.min.js',
            'lib/jquery-ui.min.js',
            'lib/loglevel.min.js',
            'lib/object-model.min.js',
            'lib/pouchdb-7.0.0.min.js',
            'lib/sjcl.min.js',
            'polyfill/core_js_shim.min.js',
            'polyfill/fetch.js',
            'polyfill/url-search-params-polyfill.min.js'
        ],
        settings: ['prefer-online'],
        output: '../manifest.appcache',
        exclude: ['asterics-grid.bundle.js'] /*hack to prevent first line of cache manifest before CACHE. These two files are already included above.*/
    });

    if (env && env.enableAppCache) {
        log('appcache enabled!');
        plugins.push(appcachePlugin);
    } else {
        log('appcache disabled!');
        plugins.push(new CleanWebpackPlugin(['./app/manifest.appcache']));
    }

    function log(msg) {
        if(!env || !env.nolog) {
            console.log(msg);
        }
    }

    function getDevServer() {
        return {
            contentBase: path.resolve(__dirname),
            publicPath:  '/' + buildDirLegacy,
            host: '0.0.0.0',
            port: 9095,
            open: false,
            watchContentBase: true
        };
    }

    /*var configNormal = {
        mode: mode,
        entry: entryScript,
        plugins: plugins,
        output: {
            path: path.resolve(__dirname, baseDir + buildDir),
            publicPath: buildDir,
            filename: outputFilename
        },
        resolve: resolve,
        devServer: getDevServer(),
        externals: externals,
        module: {
            rules: [scssRule, vueRule]
        }
    };*/

    var configLegacy = {
        mode: mode,
        entry: entryScript,
        plugins: plugins,
        output: {
            path: path.resolve(__dirname, baseDir + buildDirLegacy),
            publicPath: "/" + buildDirLegacy,
            filename: outputFilename,
            chunkFilename: '[name].bundle.js',
        },
        resolve: resolve,
        devServer: getDevServer(),
        externals: externals,
        module: {
            rules: [babelRule, scssRule, vueRule],
        }
    };
    return [/*configNormal,*/ configLegacy];
};