var path = require('path');

module.exports = {
    mode: 'development',
    entry: './static/js/mainScript.js',
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'asterics-grid.bundle.js'
    }
};