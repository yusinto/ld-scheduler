const path = require('path');
const webpack = require('webpack');
const uiFolder = path.resolve(__dirname, 'src/ui');
const clientFolder = path.resolve(uiFolder, 'client');

module.exports = {
  mode: 'development',
  entry: ['webpack-hot-middleware/client', path.resolve(clientFolder, 'index')],
  output: {
    filename: 'main.js',
    path: path.resolve(uiFolder, 'dist'),
    publicPath: '/dist/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: uiFolder,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ],
  },
  // Enables hot module replacement in webpack
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
};
