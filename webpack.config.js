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
          'AudnsE9kRlPuBM5fyrW8Sswp9H9ML88ERW432s1ezGmTTFZ8Yow/T3voxChIIP0ygAI'+
          'rbWGTJ8zJ11n7evhg0AcAAABKeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjI5NT'+
          'Q4IiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5MTM1NDM1Nn0='
        },
        // https://webcps.ky0lo.com/
        'ot2': { 'http-equiv': 'origin-trial', 'content':        
          'AvkRsNH535Pwb9ZV8yRkb/9UZbc3fr7HksWsrtX55B0LYZjl9mPNY8pPJZgNytE5Jlu'+
          'UMCRkLgQvGJqC/ciM1QIAAABQeyJvcmlnaW4iOiJodHRwczovL3dlYmNwcy5reTBsby'+
          '5jb206NDQzIiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5MTI1MzcxN30='
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
