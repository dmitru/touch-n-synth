
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'build/bundle.js'
    },
    //devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.scss$/,
                loader: "style-loader!raw-loader!sass-loader?includePaths[]=" + path.resolve(__dirname, "./node_modules/compass-mixins/lib")
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('build/style.css', {
            allChunks: true
        })
    ]
};