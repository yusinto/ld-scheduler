const path = require('path');
const webpack = require('webpack');
const srcFolder = path.resolve(__dirname, 'src');
const clientFolder = path.resolve(srcFolder, 'client');

module.exports = {
  mode: 'development',
  entry: ['webpack-hot-middleware/client', path.resolve(clientFolder, 'index')],
  output: {
    filename: 'main.js',
    path: path.resolve(srcFolder, 'dist'),
    publicPath: '/dist/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: srcFolder,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        include: srcFolder,
        exclude: /node_modules/,
        use: [
          {loader: 'style-loader'},
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true,
              localIdentName: '[folder]--[name]--[local]--[hash:base64:2]',
            }
          },
        ]
      }
    ],
  },
  // Enables hot module replacement in webpack
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
};
