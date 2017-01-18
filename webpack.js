const webpackEasy = require('webpack-easy');

webpackEasy
    .entry(
        webpackEasy.isProduction() ?
        {'dist/fileup-core': './src/index.js'} :
        {'assets/bundle-index': './tests/web/index.js'}
    )
    .output({
        path: `${__dirname}/`,
        filename: '[name].js',
    })
    .serverConfig({
        contentBase: './tests/web',
    });
