/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const userMeta = require('user-meta');
const gitBranch = require('git-branch');

const { name: userName, email } = userMeta;

// TODO
// distingush build type: start with cache, start without cache
// distingush build type: production with cache, production without cache
enum BuildType {
  'development-start' = 'development-start',
  // 'development-start-without-cache': 'development-start-without-cache',
  // 'development-start-with-cache': 'development-start-with-cache',
  'development-hmr' = 'development-hmr',
  'production' = 'production',
  // 'production-without-cache': 'production-without-cache',
  // 'production-with-cache': 'production-with-cache',
  'unknown-build-type' = 'unknown-build-type',
}

const csvHeaders = [
  'buildType', 'buildSpeed', 'finishTime', 'finishTimeLocale', 'gitUserName', 'gitUserEmail', 'gitBranch'
] as const;

interface OutputObject extends Record<typeof csvHeaders[number], string | number> {
  buildType: BuildType;
  buildSpeed: number;
  finishTime: number;
  finishTimeLocale: string;
  gitUserName: string;
  gitUserEmail: string;
  gitBranch: string;
}

interface PluginOptions {
  callback?: (output: OutputObject) => void;
  outputFormat?: 'json' | 'csv' | false;
  outputPath?: string;
}

const writeStatsFile = (content: OutputObject, options: PluginOptions) => {
  const {outputPath, outputFormat} = options;
  const filename = `buildStats.${outputFormat}`;
  const outputFilePath = path.join(outputPath, filename);

  try {
    if (!fs.existsSync(outputFilePath)) {
      const defaultContent = outputFormat === 'json' ? '[]' : (csvHeaders.join(',') + '\n');
      fs.writeFileSync(outputFilePath, defaultContent, 'utf8');
    }

    if (outputFormat === 'json') {
      const fileContent = fs.readFileSync(outputFilePath, 'utf8');
      const fileContentArray = JSON.parse(fileContent);
      fileContentArray.push(content);
      const jsonContent = JSON.stringify(fileContentArray, null, 2);

      fs.writeFileSync(outputFilePath, jsonContent, 'utf8');
    } else if (outputFormat === 'csv') {
      const csvContent = csvHeaders.map((header) => content[header]).join(',') + '\n';
      fs.appendFileSync(outputFilePath, csvContent, 'utf8');
    }
  } catch (err) {
    console.error('BuildStatsWebpackPlugin error: ', err);
  }
};

interface BuildStats {
  mode: string;
  'thisCompilation.compilationParams.normalModuleFactory.resolverFactory.cache.size': number;
  'thisCompilation.compilationParams.contextModuleFactory.resolverFactory.cache.size': number;
  'done.stats.compilation.startTime': number;
  'done.stats.compilation.endTime': number;
}

// build stats that collected from webpack
const generateBuildStatsTemplate = (): BuildStats => {
  return {
    'mode': '',
    'thisCompilation.compilationParams.normalModuleFactory.resolverFactory.cache.size': 0,
    'thisCompilation.compilationParams.contextModuleFactory.resolverFactory.cache.size': 0,
    'done.stats.compilation.startTime': 0,
    'done.stats.compilation.endTime': 0,
  };
};

const getBuildType = (buildStats: BuildStats): BuildType => {
  const { mode } = buildStats;

  if (mode === 'production') {
    return BuildType.production;
  } else if (mode === 'development') {
    const normalModuleCacheSize = buildStats['thisCompilation.compilationParams.normalModuleFactory.resolverFactory.cache.size'];
    const contextModuleCacheSize = buildStats['thisCompilation.compilationParams.contextModuleFactory.resolverFactory.cache.size'];
    const isHotReload = normalModuleCacheSize > 0 || contextModuleCacheSize > 0;
    if (isHotReload) {
      return BuildType['development-hmr'];
    } else {
      return BuildType['development-start'];
    }
  }

  return BuildType['unknown-build-type'];
};

const noop = () => { /* noop */ };

const handleOutput = (buildStats: BuildStats, options: PluginOptions) => {
  const endTime = buildStats['done.stats.compilation.endTime'];
  const startTime = buildStats['done.stats.compilation.startTime'];

  const output: OutputObject = {
    'buildType': BuildType['unknown-build-type'],
    'buildSpeed': endTime - startTime,
    'finishTime': endTime,
    'finishTimeLocale': Date.prototype.toLocaleString.call(new Date(endTime)),
    'gitUserName': userName,
    'gitUserEmail': email,
    'gitBranch': gitBranch.sync(),
  };

  const buildType = getBuildType(buildStats);
  output.buildType = buildType;

  if (options.callback) {
    options.callback(output);
  }

  if (options.outputFormat !== false) {
    writeStatsFile(output, options);
  }
};

class BuildStatsWebpackPlugin {

  options: PluginOptions = {
    callback: noop,
    outputFormat: 'json',
    outputPath: process.cwd(),
  };

  constructor(options?: PluginOptions) {
    options?.callback && (this.options.callback = options.callback);
    (options?.outputFormat !== undefined) && (this.options.outputFormat = options.outputFormat);
    options?.outputPath && (this.options.outputPath = options.outputPath);
  }

  apply(compiler: any) {
    let mode = '';
    let buildStats = generateBuildStatsTemplate();

    compiler.hooks.afterEnvironment.tap({ name: 'BuildStatsWebpackPlugin' }, () => {
      // console.log('BuildStatsWebpackPlugin afterEnvironment compiler.options', compiler.options);
      mode = compiler.options.mode;
    });

    compiler.hooks.thisCompilation.tap({ name: 'BuildStatsWebpackPlugin' }, (compilation: any, compilationParams: any) => {
      // console.log('--- BuildStatsWebpackPlugin thisCompilation ---');
      buildStats = generateBuildStatsTemplate();
      buildStats.mode = mode;

      const normalModuleCacheSize = compilationParams.normalModuleFactory.resolverFactory.cache.size;
      const contextModuleCacheSize = compilationParams.contextModuleFactory.resolverFactory.cache.size;

      buildStats['thisCompilation.compilationParams.normalModuleFactory.resolverFactory.cache.size'] = normalModuleCacheSize;
      buildStats['thisCompilation.compilationParams.contextModuleFactory.resolverFactory.cache.size'] = contextModuleCacheSize;
    });

    compiler.hooks.done.tap({ name: 'BuildStatsWebpackPlugin' }, (stats: any) => {
      // console.log('--- BuildStatsWebpackPlugin done ---');
      // console.log('BuildStatsWebpackPlugin stats.compilation', Object.keys(stats.compilation));
      // console.log('stats.compilation.resolverFactory', stats.compilation.resolverFactory);

      const startTime = stats.compilation.startTime;
      const endTime = stats.compilation.endTime;
      buildStats['done.stats.compilation.startTime'] = startTime;
      buildStats['done.stats.compilation.endTime'] = endTime;

      // const cacheSize = stats.compilation.resolverFactory.cache.size;
      // output['done.compilation.resolverFactory.cache.size'] = cacheSize;

      // const statsString = JSON.stringify(stats.compilation, null, 2);
      // fs.writeFileSync(path.join(__dirname, 'stats.json'), statsString, 'utf8');


      // const statsJson = stats.toJson({
      //   chunks: false,
      //   modules: false,
      // });
      // const statsString = JSON.stringify(statsJson, null, 2);
      // fs.writeFileSync(path.join(__dirname, 'stats.json'), statsString, 'utf8');

      handleOutput(buildStats, this.options);

      buildStats = generateBuildStatsTemplate();
    });
  }
}

module.exports = BuildStatsWebpackPlugin;
