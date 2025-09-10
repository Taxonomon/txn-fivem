const fs = require('fs');
const path = require('path');

type CopyConfig = {
  directory: boolean,
  source: string,
  target: string
};

const processName = '[copyToFxServer]';
const pathToConfig = 'config.json';

run();

function run() {
  console.log(`${processName} ----- Starting process -----`);

  const startTime = performance.now();
  let configs: CopyConfig[] = [];

  try {
    configs = JSON.parse(fs.readFileSync(pathToConfig, 'utf-8'));
  } catch (err) {
    console.error(`${processName} Failed to parse ${pathToConfig}: ${err}`);

    const durationMs = (performance.now() - startTime).toFixed(0);
    console.log(`${processName} ----- Finished with error in ${durationMs} ms -----`);

    return;
  }

  for(let i = 0; i < configs.length; i++) {
    console.log(`${processName} --- Processing config ${i + 1}/${configs.length}...`);
    const config = configs[i];
    try {
      copyToFxServer(config.source, config.target, config.directory)
    } catch (err) {
      console.error(`${processName} Failed to copy files to FXServer: ${err}`);

      const durationMs = (performance.now() - startTime).toFixed(0);
      console.log(`${processName} ----- Finished with error in ${durationMs} ms -----`);
    }
  }

  const durationMs = (performance.now() - startTime).toFixed(0);
  console.log(`${processName} ----- Finished copying ${configs.length} entries to FXServer in ${durationMs} ms -----`);
}

function copyToFxServer(source: string, target: string, isDirectory: boolean) {
  cleanUpTarget(target, isDirectory);

  if (isDirectory) {
    const inputDir: string[] = fs.readdirSync(source);
    if (inputDir.length === 0) {
      console.log(`${processName} No contents to copy found in source directory '${source}'`);
      return;
    }

    // copy to target
    console.log(`${processName} copying '${source}' to '${target}'...`);
    fs.cpSync(source, target, { recursive: true, force: true });
    console.log(`${processName} Finished copying contents from '${source}' to '${target}'`);
  } else {
    if (!fs.existsSync(source)) {
      console.log(`${processName} '${source}' does not exist - skipping...`);
    } else {
      fs.copyFileSync(source, target);
      console.log(`${processName} Copied '${source}' to '${target}'`);
    }
  }

}

function cleanUpTarget(target: string, isDirectory: boolean) {
  if (fs.existsSync(target)) {
    if (isDirectory) {
      console.log(`${processName} Cleaning up target directory first before copying contents from source: '${target}'`);
      fs.rmSync(target, { recursive: true, force: true });
      fs.mkdirSync(target);
    }
  } else if (isDirectory) {
    console.log(`${processName} Target directory does not exist - creating...`);

    fs.mkdirSync(
      isDirectory ? path.dirname(target) : target,
      {recursive: true, force: true}
    );
  }
}
