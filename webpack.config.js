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
            'app/index.html',
            'app/build/asterics-grid.bundle.js',
            'app/build_legacy/asterics-grid.bundle.js',
            'app/css/fontawesome/css/all.css',
            'app/css/fontawesome/webfonts/fa-brands-400.eot',
            'app/css/fontawesome/webfonts/fa-brands-400.svg',
            'app/css/fontawesome/webfonts/fa-brands-400.ttf',
            'app/css/fontawesome/webfonts/fa-brands-400.woff',
            'app/css/fontawesome/webfonts/fa-brands-400.woff2',
            'app/css/fontawesome/webfonts/fa-regular-400.eot',
            'app/css/fontawesome/webfonts/fa-regular-400.svg',
            'app/css/fontawesome/webfonts/fa-regular-400.ttf',
            'app/css/fontawesome/webfonts/fa-regular-400.woff',
            'app/css/fontawesome/webfonts/fa-regular-400.woff2',
            'app/css/fontawesome/webfonts/fa-solid-900.eot',
            'app/css/fontawesome/webfonts/fa-solid-900.svg',
            'app/css/fontawesome/webfonts/fa-solid-900.ttf',
            'app/css/fontawesome/webfonts/fa-solid-900.woff',
            'app/css/fontawesome/webfonts/fa-solid-900.woff2',
            'app/css/jquery-ui.css',
            'app/css/images/ui-icons_444444_256x240.png',
            'app/css/custom.css',
            'app/css/skeleton.css',
            'app/img/asterics-grid-icon.png',
            'app/img/asterics_icon.png',
            'app/img/favicon.ico',
            'app/lib/dom-i18n.min.js',
            'app/lib/gridList.js',
            'app/lib/jquery.contextMenu.min.js',
            'app/lib/jquery.gridList.js',
            'app/lib/jquery.min.js',
            'app/lib/jquery.ui.position.min.js',
            'app/lib/jquery.ui.touchpunch.min.js',
            'app/lib/jquery-ui.min.js',
            'app/lib/loglevel.min.js',
            'app/lib/object-model.min.js',
            'app/lib/pouchdb-7.0.0.min.js',
            'app/lib/pouchdb-find-7.0.0.min.js',
            'app/lib/sjcl.min.js',
            'app/polyfill/core_js_shim.min.js',
            'app/polyfill/fetch.js',
            'app/polyfill/url-search-params-polyfill.min.js'
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

    var configNormal = {
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
    };

    var configLegacy = {
        mode: mode,
        entry: entryScript,
        plugins: plugins,
        output: {
            path: path.resolve(__dirname, baseDir + buildDirLegacy),
            publicPath: buildDirLegacy,
            filename: outputFilename
        },
        resolve: resolve,
        devServer: getDevServer(),
        externals: externals,
        module: {
            rules: [{
                test: /\.m?js$/,
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
                                        'Firefox ESR',
                                        'ie >= 11'
                                    ],
                                },
                            }],
                        ],
                    },
                },
            },
                scssRule, vueRule
            ],
        }
    };
    return [configNormal, configLegacy];
};