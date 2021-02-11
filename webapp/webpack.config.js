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
      meta: {
        // WebSerial origin trial tokens
        // http://localhost:29548/
        'ot1': { 'http-equiv': 'origin-trial', 'content':
          'AnUBMwDTrDQp1vsgyl5NG8gvkGvzecr9O9vKSToKNnMFegVD0THsaBf5T/7BhV0WbrO'+
          'S1XyLiPpUUpYqYEeRlAcAAABKeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjI5NT'+
          'Q4IiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTYxNzc1MzU5OX0='
        },
        // https://webcps.ky0lo.com/
        'ot2': { 'http-equiv': 'origin-trial', 'content':
          'AgJhz2Vhmh6hqRqogA5EkFut7OY5A8eK9EvWiKRKEPh7AqyO/Pe+DLfOEg5b3YyCkxu'+
          'LahlKviRx7je/ctTk2A0AAABQeyJvcmlnaW4iOiJodHRwczovL3dlYmNwcy5reTBsby'+
          '5jb206NDQzIiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTYxNzc1MzU5OX0='
        }
      }
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
