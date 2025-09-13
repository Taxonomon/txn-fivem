import {PACKAGE_NAME} from "../common/package.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {clientTrafficState} from "./state.ts";
import {wait} from "../../util/common/util.ts";

const log = new ConsoleLogger(PACKAGE_NAME);
const HIDE_TRAFFIC_DEFAULTS = {
  RADIUS: 500.0,
  INTERVAL_MS: 250.0
}

export async function startDisablingTraffic() {
  clientTrafficState.tickDisableTraffic = setTick(async () => {
    const [ x, y, z ] = GetEntityCoords(PlayerPedId());

    // these natives have to be called every frame

    // set traffic density to 0
    SetVehicleDensityMultiplierThisFrame(0.0);

    // set npc/ai peds density to 0
    SetPedDensityMultiplierThisFrame(0.0);

    // set random vehicles (car scenarios / cars driving off from a parking spot etc.) to 0
    SetRandomVehicleDensityMultiplierThisFrame(0.0);

    // set random parked vehicles (parked car scenarios) to 0
    SetParkedVehicleDensityMultiplierThisFrame(0.0);

    // set random npc/ai peds or scenario peds to 0
    SetScenarioPedDensityMultiplierThisFrame(0.0, 0.0);

    // Stop garbage trucks from randomly spawning
    SetGarbageTrucks(false);

    // Stop random boats from spawning in the water.
    SetRandomBoats(false);

    // disable random cops walking/driving around.
    SetCreateRandomCops(false);

    // stop random cops (not in a scenario) from spawning.
    SetCreateRandomCopsNotOnScenarios(false);

    // stop random cops (in a scenario) from spawning.
    SetCreateRandomCopsOnScenarios(false);

    ClearAreaOfVehicles(
      x,
      y,
      z,
      HIDE_TRAFFIC_DEFAULTS.RADIUS,
      false,
      false,
      false,
      false,
      false
    );

    ClearAreaOfPeds(
      x,
      y,
      z,
      HIDE_TRAFFIC_DEFAULTS.RADIUS,
      false
    );

    RemoveVehiclesFromGeneratorsInArea(
      x - HIDE_TRAFFIC_DEFAULTS.RADIUS,
      y - HIDE_TRAFFIC_DEFAULTS.RADIUS,
      z - HIDE_TRAFFIC_DEFAULTS.RADIUS,
      x + HIDE_TRAFFIC_DEFAULTS.RADIUS,
      y + HIDE_TRAFFIC_DEFAULTS.RADIUS,
      z + HIDE_TRAFFIC_DEFAULTS.RADIUS
    );

    await wait(HIDE_TRAFFIC_DEFAULTS.INTERVAL_MS);
  });
  log.debug(
    `Started disabling traffic within ${HIDE_TRAFFIC_DEFAULTS.RADIUS} units of the player`
    + `every ${HIDE_TRAFFIC_DEFAULTS.INTERVAL_MS === 0 ? 'frame' : HIDE_TRAFFIC_DEFAULTS.INTERVAL_MS + ' ms'}`
  );
}

export function stopDisablingTraffic() {
  if (undefined !== clientTrafficState.tickDisableTraffic) {
    try {
      clearTick(clientTrafficState.tickDisableTraffic);
      log.debug(`Stopped disabling traffic within ${HIDE_TRAFFIC_DEFAULTS.RADIUS} units of the player`);
    } catch (error: any) {
      log.error(
        `Failed to stop disabling traffic within ${HIDE_TRAFFIC_DEFAULTS.RADIUS} `
        + `units of the player: ${error.message}`
      );
    }
  }
}
