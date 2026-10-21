module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    ios: '12'
                },
                useBuiltIns: 'usage', // only include needed polyfills
                corejs: 3,            // specify version of core-js
                bugfixes: true
            }
        ]
    ]
};