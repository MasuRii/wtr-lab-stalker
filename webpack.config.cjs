const path = require('node:path');
const webpack = require('webpack');
const { USERSCRIPT_METADATA } = require('./userscript.metadata.cjs');

/** @type {import('webpack').Configuration} */
const config = {
    mode: 'production',
    target: 'web',
    entry: './src/index.ts',
    devtool: false,
    output: {
        filename: 'wtr-lab-stalker.user.js',
        path: path.resolve(__dirname, 'dist'),
        iife: true,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: USERSCRIPT_METADATA,
            raw: true,
            entryOnly: true,
        }),
    ],
};

module.exports = config;
