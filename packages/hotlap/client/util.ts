import {ConsoleLogger} from "../../logging/common/log";
import {wait} from "../common/util";
import {PACKAGE_NAME} from "../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export async function waitForModelToLoad(hash: number) {
  let secondsPassed = Timera();
  let loaded = false;

  RequestModel(hash);
  while (!loaded) {
    if (secondsPassed >= 5) {
      throw new Error(`Failed to load model for hash=${hash} after 5 seconds`);
    }
    loaded = HasModelLoaded(hash)
    await wait(0);
  }
}
