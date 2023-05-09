let path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = env => {
    let buildDir = 'app/build/';
    let entryScript = './src/js/mainScript.js';
    let outputFilename = 'asterics-grid.bundle.js';
    let mode = env && env.production ? 'production' : 'development';

    let scssRule = {
        test: /\.(s*)css$/,
        use: ['style-loader', 'css-loader']
    };

    let vueRule = {
        test: /\.vue$/,
        loader: 'vue-loader'
    };

    return {
        mode: mode,
        entry: entryScript,
        plugins: [new VueLoaderPlugin()],
        output: {
            path: path.resolve(__dirname, buildDir),
            publicPath: "/" + buildDir,
            filename: outputFilename,
            chunkFilename: '[name].bundle.js',
        },
        resolve: {
            alias: {
                vue: 'vue/dist/vue.esm.js',
                predictionary: 'predictionary/src/index.mjs'
            }
        },
        devServer: {
            static: {
                directory: path.resolve(__dirname),
                watch: true
            },
            host: '0.0.0.0',
            port: 9095,
            open: false,
            hot: true
        },
        externals: {
            jquery: '$',
            PouchDB: 'PouchDB'
        },
        module: {
            rules: [scssRule, vueRule]
        }
    };
};