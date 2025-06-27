const { merge } = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = (config) => {
  return merge(config, {
    target: 'node',
    externals: [nodeExternals()],
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'serverless.js',
      libraryTarget: 'commonjs',
    },
  });
};
