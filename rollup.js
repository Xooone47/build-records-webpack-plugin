/* eslint-disable @typescript-eslint/no-var-requires */
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: 'src/build-stats-webpack-plugin.ts',
  output: {
    file: 'dist/build-stats-webpack-plugin.js',
    format: 'cjs'
  },
  plugins: [
    typescript()
  ]
};
