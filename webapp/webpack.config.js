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
          'AllAzUThJShkBc91evGucT2xwhVwUAlXEi9x6iubQKMndIEOppZEyfEQ/CMNZ1H9hSa'+
          'GcLgeWKI+TTlBuNG8hgEAAABKeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjI5NT'+
          'Q4IiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTYwMzkzNjkyNH0='
        },
        // https://webcps.ky0lo.com/
        'ot2': { 'http-equiv': 'origin-trial', 'content':
          'Ak9EzqTLk+9CycoH4yHb30/zxgE9naUK0QISWA39rh6Hz6q0fSqvJMgFQF2m4B3EYMu'+
          'JepXghpVZ1X+xNYr8kAAAAABQeyJvcmlnaW4iOiJodHRwczovL3dlYmNwcy5reTBsby'+
          '5jb206NDQzIiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTYwMzkzNjkzMH0='
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
