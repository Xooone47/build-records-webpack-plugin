/* eslint-disable @typescript-eslint/no-var-requires */
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: 'src/build-records-webpack-plugin.ts',
  output: {
    file: 'dist/build-records-webpack-plugin.js',
    format: 'cjs'
  },
  plugins: [
    typescript()
  ]
};
