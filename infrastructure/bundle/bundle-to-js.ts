const esbuild = require('esbuild');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

const prefix = '[typescript-resource-bundler]';
const tempDir = 'temp';

const logMsgs = {
  skipping: `${prefix} Skipping bundling of config entry`,
  beginning: `${prefix} Beginning bundling of config entry`,
  canceling: `${prefix} Canceling bundling of config entry`,
  bundled: `${prefix} Successfully bundled config entry`,
  failed: `${prefix} Failed bundling config entry`
}

type BuildSetting = {
  source: string,
  target: string,
  enabled: boolean
};

let configs: BuildSetting[] = [];

const startTime = performance.now();

try {
  configs = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  configs.forEach(async (config, i) => await bundle(config, i + 1, configs.length));
} catch (err) {
  console.error(`${prefix} Failed to parse config.json: ${err}`);
} finally {
  const durationMs = (performance.now() - startTime).toFixed(0);
  console.log(`${prefix} ----- All bundle entries processed in ${durationMs} ms -----`);
}

async function bundle(config: BuildSetting, i: number, noOfEntries: number) {
  const { source, target, enabled } = config;
  const currentEntry = `${i}/${noOfEntries}`;

  console.log(`${prefix} ----- Processing bundle entry ${currentEntry} -----`);

  if (!enabled) {
    console.log(`${logMsgs.skipping} ${currentEntry} (entry disabled)`);
    return;
  } else if (isUndefined(source)) {
    console.error(`${logMsgs.skipping} ${currentEntry} (source undefined)`);
    return;
  } else if (isUndefined(target)) {
    console.error(`${logMsgs.skipping} ${currentEntry} (target undefined)`);
    return;
  }

  console.log(`${logMsgs.beginning} ${currentEntry} from '${source}' to '${target}'`);

  try {
    console.log(`${prefix} Cleaning target '${target}'...`);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`${prefix} Cleaned '${target}'`);
    }
  } catch (err) {
    console.error(`${logMsgs.canceling} ${currentEntry} (failed to clean target: ${err})`);
    return;
  }

  let typeScriptFiles: string[] = [];

  try {
    console.log(`${prefix} Collecting TypeScript files from '${source}...'`);
    typeScriptFiles = glob
      .sync(`${source}/**/*.ts`)
      .filter((file: string) =>
        !file.endsWith('main_temp.ts')
      );
  } catch (err) {
    console.error(`${logMsgs.canceling} ${currentEntry} (failed to fetch TypeScript files from source: ${err})`);
    return;
  }

  if (typeScriptFiles.length === 0) {
    console.warn(`${logMsgs.canceling} ${currentEntry} (no TypeScript files found in '${source}')`);
    return;
  }

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  } catch (err: any) {
    console.error(`${prefix} Failed to create temp directory '${tempDir}' for temporary TypeScript bundle file:' +
    ' ${err.message}`);
  }
  const temporaryBuildFileName = path.join(source, `/bundle_temp_${Date.now().toString()}.ts`);

  try {
    console.log(`${prefix} Building temporary TypeScript bundle file '${temporaryBuildFileName}'...`);
    const imports = typeScriptFiles.map((file: string) => {
      const relativePath: string = './' + path
        .relative(source, file)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');

      return `import '${relativePath}';`;
    });
    fs.writeFileSync(temporaryBuildFileName, imports.join('\n'));
  } catch (err) {
    console.error(`${logMsgs.canceling} ${currentEntry} (failed to write temporary bundle file: ${err})`);
    try {
      console.log(`${prefix} Cleaning up temporary TypeScript bundle file '${temporaryBuildFileName}'...`);
      deleteTemporaryBuildFile(temporaryBuildFileName);
      return;
    } catch (err) {
      console.error(`${prefix} Failed to clean up temporary TypeScript bundle file '${temporaryBuildFileName}': ${err}`);
      return;
    }
  }

  const esBuildConfig: any = {
    entryPoints: [ temporaryBuildFileName ],
    outfile: target,
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    format: 'iife',
    minify: false,
    sourcemap: false,
    external: [
      '@citizenfx/server/natives_server',
      '@citizenfx/server/natives_client'
    ]
  };

  console.log(`${prefix} Bundling temporary TypeScript bundle file '${temporaryBuildFileName}' to JavaScript using ESBuild...`);

  try {
    await esbuild.build(esBuildConfig);
    console.log(`${prefix} ${logMsgs.bundled} ${currentEntry} via '${temporaryBuildFileName}' to '${target}'`);
  } catch (err) {
    console.error(`${logMsgs.failed} ${currentEntry} (es build failed with error: ${err}`);
  }

  try {
    console.log(`${prefix} Cleaning up temporary TypeScript bundle file '${temporaryBuildFileName}'...`);
    deleteTemporaryBuildFile(temporaryBuildFileName);
  } catch (err) {
    console.error(`${prefix} Failed to clean up temporary TypeScript bundle file '${temporaryBuildFileName}': ${err}`);
    return;
  }
}

function deleteTemporaryBuildFile(file: string) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.log(`${prefix} Failed to delete temporary build file '${file}': ${err}`);
    }
  }
}

function isUndefined(o: any) {
  return typeof o === 'undefined';
}
