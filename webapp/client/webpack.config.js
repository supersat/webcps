const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
let isDevMode = env == 'development';

module.exports = {
  mode: env,
  devtool: isDevMode ? 'inline-source-map' : false,
  devServer: {
    port: 29548
  },
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'WebCPS',
    }),
  ],
  resolve: {
    extensions: ['.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
