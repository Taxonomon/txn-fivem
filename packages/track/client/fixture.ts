import {Fixture} from "../common/track.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export const FIXTURE_REMOVAL_DEFAULTS = {
  GAME_POOL: {
    OBJECTS: 'CObject'
  },
  REMOVAL: {
    // this is the default removal radius to use when a prop has none defined
    // max should be 500.0
    RADIUS: 3.0,
    // hashes to force being removed (currently unused)
    FORCE: [
      -1063472968, // prop_streetlight_01
      1821241621,  // prop_streetlight_01b
      -1222468156, // prop_streetlight_02
      729253480,   // prop_streetlight_03
      1327054116,  // prop_streetlight_03b
      1021745343,  // prop_streetlight_03c
      -1114695146, // prop_streetlight_03d
      -1454378608, // prop_streetlight_03e
    ],
  },
  DETECTION: {
    // check if fixtures can be removed within this radius to the player
    // 1000.0 is just straight up not working with poles and lamps
    RADIUS: 150.0,
    INTERVAL_MS: 500
  },
}

export async function hideFixture(fixture: Fixture) {
  try {
    CreateModelHideExcludingScriptObjects(
      fixture.coords.x,
      fixture.coords.y,
      fixture.coords.z,
      fixture.radius,
      fixture.hash,
      true
    );
    return true;
  } catch (error) {
    log.error(`Failed to hide fixture (hash=${fixture.hash}): ${error}`);
    return false;
  }
}

export async function unhideFixture(fixture: Fixture) {
  RemoveModelHide(
    fixture.coords.x,
    fixture.coords.y,
    fixture.coords.z,
    fixture.radius,
    fixture.hash,
    false
  );
}
