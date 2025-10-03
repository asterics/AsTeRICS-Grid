let path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
        plugins: [
            new VueLoaderPlugin(),
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, 'node_modules/@morphgrid/core/public/wasm'), to: path.resolve(__dirname, 'app/public/wasm') }
                ]
            })
        ],
        output: {
            path: path.resolve(__dirname, buildDir),
            publicPath: publicPath,
            filename: outputFilename,
            chunkFilename: '[name].bundle.js',
        },
            performance: {
                hints: false
            },

        resolve: {
            alias: {
                vue: 'vue/dist/vue.esm.js',
                predictionary: 'predictionary/src/index.mjs'
            },
            fallback: {
                url: false,
                worker_threads: false
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
            client: { overlay: true },
            setupMiddlewares: (middlewares, devServer) => {
                if (!devServer) return middlewares;
                // Serve .wasm with correct MIME and bypass any SPA fallback
                devServer.app.get(['/app/public/wasm/:file', '/node_modules/@morphgrid/core/public/wasm/:file'], (req, res) => {
                    const isPublic = req.path.startsWith('/app/public/wasm/');
                    const baseDir = isPublic ? path.resolve(__dirname, 'app/public/wasm') : path.resolve(__dirname, 'node_modules/@morphgrid/core/public/wasm');
                    res.setHeader('Content-Type', 'application/wasm');
                    res.sendFile(path.join(baseDir, req.params.file));
                });

                // Serve morphgrid packs with correct paths
                devServer.app.get('/node_modules/@morphgrid/packs/public/*', (req, res) => {
                    const filePath = path.resolve(__dirname, req.path);
                    res.sendFile(filePath);
                });

                return middlewares;
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