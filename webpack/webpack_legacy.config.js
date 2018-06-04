var path = require('path');

module.exports = {
    mode: 'development',
    entry: './static/js/mainScript.js',
    output: {
        path: path.resolve(__dirname, '../build_legacy'),
        filename: 'asterics-grid.bundle.js'
    },
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