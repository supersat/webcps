const path = require('path');

let env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
let isDevMode = env == 'development';

module.exports = {
  mode: env,
  devtool: isDevMode ? 'inline-source-map' : false,
  entry: './src/index.js',
  resolve: {
    extensions: ['.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};