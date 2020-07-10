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
          'Ai+G63v5KoW6/46i8GeSLYSG1rh8mPAeCVM7TuSiMATthQ0D6MRReSBySm5jNlMcY0V'+
          'F+z8SPNqVR1gFdEi43gwAAABKeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjI5NT'+
          'Q4IiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5Nzk2NzU1MH0='
        },
        // https://webcps.ky0lo.com/
        'ot2': { 'http-equiv': 'origin-trial', 'content':
          'AumFdCZ2fiZgBObOMPV1qaSZSIjj93zthBSLE4L9HqTyWGMhSH2qwQ4rCj1IMBKEpvO'+
          'NjDzbdPlzNG2WuEuCagoAAABQeyJvcmlnaW4iOiJodHRwczovL3dlYmNwcy5reTBsby'+
          '5jb206NDQzIiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5Nzk2NzU2OX0='
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
