const tsLintPlugin = require('tslint-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/winuvo-cli/app.ts',
    target: 'node',
    node: {
        __dirname: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: [ 'ts-loader'],
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: [
        /^[a-z\-0-9]+$/ // Ignore node_modules folder
    ],
    plugins: [
        new tsLintPlugin({
            files: ['./src/winuvo-cli/**/*.ts']
        }),
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true })
    ],
    output: {
        filename: 'winuvo.js',
        path: path.resolve(__dirname, './dist'),
        libraryTarget: "commonjs",
        devtoolModuleFilenameTemplate: '[absolute-resource-path]'
    },
    mode: 'development',
    devtool: 'inline-source-map'
};