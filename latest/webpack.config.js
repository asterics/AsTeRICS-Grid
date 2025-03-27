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
        loader: 'vue-loader',
        options: { sourceMap: mode !== "production" }
    };

    let publicPath = env.production ? buildDir : `/${buildDir}`
    return {
        mode: mode,
        devtool: mode === 'production' ? false : 'eval-source-map', // Enable source maps in development
        entry: entryScript,
        plugins: [new VueLoaderPlugin()],
        output: {
            path: path.resolve(__dirname, buildDir),
            publicPath: publicPath,
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
            hot: true,
            client: {
                overlay: true
            }
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