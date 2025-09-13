import {wait} from "../common/util.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {CLIENT_RESOURCE_EVENTS} from "../common/event.ts";
import {commonClientState} from "./state.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

on(CLIENT_RESOURCE_EVENTS.ON_RESOURCE_START, () => {
  commonClientState.ticks.playerCoords.start(updatePlayerCoordinates);
});

const MODEL_LOAD_DEFAULTS = {
  CANCEL_AFTER_MS: 3000
};

export async function waitForModelToLoad(hash: number) {
  let startTime = Date.now();
  let loaded = false;

  RequestModel(hash);

  while (!loaded) {
    // cancel after X seconds
    if ((Date.now() - startTime) >= MODEL_LOAD_DEFAULTS.CANCEL_AFTER_MS) {
      throw new Error(
        `Failed to load model for hash=${hash} after ${MODEL_LOAD_DEFAULTS.CANCEL_AFTER_MS} ms`
      );
    }
    loaded = HasModelLoaded(hash)
    await wait(0);
  }
}

async function updatePlayerCoordinates() {
  const [ x, y, z ] = GetEntityCoords(PlayerPedId(), false);
  commonClientState.playerCoords = { x, y, z };
}
