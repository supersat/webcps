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
          'Av8ojvNp2RO+0NJp2QA1+iXwoibkGBdnkPMUJQhvS43zxLsBJUVUMCWdvYuPF4NAzXJ'+
          '8WIjEsCp7lGkjSHNc0gIAAABKeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjI5NT'+
          'Q4IiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5NDkzNjkxNX0='
        },
        // https://webcps.ky0lo.com/
        'ot2': { 'http-equiv': 'origin-trial', 'content':
          'AmD575UwBw94nhANRDRku71UPbrCDifTUBYZJQAK+Rvw82ViJJYAztrpXyJnbSdWiaK'+
          '5roKvbmTwD6D6ACEYigIAAABQeyJvcmlnaW4iOiJodHRwczovL3dlYmNwcy5reTBsby'+
          '5jb206NDQzIiwiZmVhdHVyZSI6IlNlcmlhbCIsImV4cGlyeSI6MTU5NDkzNjkwOX0='
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
