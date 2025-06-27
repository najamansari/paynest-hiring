const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => {
  return {
    ...options,
    entry: './src/serverless.ts',
    target: 'node',
    externals: [nodeExternals()],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'serverless.js',
      libraryTarget: 'commonjs',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  };
};
