# build-records-webpack-plugin

A webpack plugin aiming to collect the build records, including build type, build speed, build time, user information, add so on.

A classical output like:

```json
{
  "buildType": "production",
  "buildSpeed": 362849,
  "finishTime": 1689585090968,
  "finishTimeLocale": "2023/7/17 17:11:30",
  "gitUserName": "Deland",
  "gitUserEmail": "insidethe47s@gmail.com",
  "gitBranch": "master"
}
```

The field **buildType** represents:

- `development-start`: Start a webpack dev-server.
- `development-hmr`: Modify codes and trigger a [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) in webpack dev-server.
- `production`: Build bundles with production mode.

## Installation

```bash
npm install --save-dev build-records-webpack-plugin
# or
yarn add -D build-records-webpack-plugin
# or
pnpm install -D build-records-webpack-plugin
```

## Usage

**webpack.config.js**:

```js
const BuildRecordsWebpackPlugin = require('build-records-webpack-plugin');

module.exports = {
  plugins: [
    new BuildRecordsWebpackPlugin()
  ]
};
```

## Options

```ts
interface PluginOptions {
  outputFormat?: 'json' | 'csv' | false;  // default: json
  outputPath?: string;  // default: process.pwd()
  callback?: (output: OutputObject) => void;
}
```

### options.outputFormat

set `outputFormat: 'json'` to emit buildStats.json:

```json
[
  {
    "buildType": "production",
    "buildSpeed": 362849,
    "finishTime": 1689585090968,
    "finishTimeLocale": "2023/7/17 17:11:30",
    "gitUserName": "Deland",
    "gitUserEmail": "insidethe47s@gmail.com",
    "gitBranch": "master"
  },
  {
    "buildType": "production",
    "buildSpeed": 19327,
    "finishTime": 1689586081730,
    "finishTimeLocale": "2023/7/17 17:28:01",
    "gitUserName": "Deland",
    "gitUserEmail": "insidethe47s@gmail.com",
    "gitBranch": "master"
  },
  {
    "buildType": "production",
    "buildSpeed": 18302,
    "finishTime": 1689586126497,
    "finishTimeLocale": "2023/7/17 17:28:46",
    "gitUserName": "Deland",
    "gitUserEmail": "insidethe47s@gmail.com",
    "gitBranch": "master"
  }
]
```

set `outputFormat: 'csv'` to emit buildStats.csv:

```csv
buildType,buildSpeed,finishTime,finishTimeLocale,gitUserName,gitUserEmail,gitBranch
production,508944,1689588410895,2023/7/17 18:06:50,Deland,insidethe47s@gmail.com,master
production,67087,1689588588760,2023/7/17 18:09:48,Deland,insidethe47s@gmail.com,master
```

### options.callback

```js
module.exports = {
  plugins: [
    new BuildRecordsWebpackPlugin({
      callback: (output) => {
        // You can collect stats in your way
        report(output);
      }
    })
  ]
}
```

The type of **Output**:

```ts
enum BuildType {
  'development-start' = 'development-start',
  'development-hmr' = 'development-hmr',
  'production' = 'production',
}

interface OutputObject {
  buildType: BuildType;
  buildSpeed: number;
  finishTime: number;
  finishTimeLocale: string;
  gitUserName: string;
  gitUserEmail: string;
  gitBranch: string;
}
```


## Supports

webpack 4, webpack 5

## Maintainer

Deland ( insidethe47s@gmail.com ).
