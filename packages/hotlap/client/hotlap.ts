import {ClientHotlapState, HotlapStatus} from "./state.ts";
import {EVENTS} from "../common/event.ts";
import {
  CHECKPOINT_DEFAULTS,
  drawCheckpointBlip,
  drawCheckpointHolo,
  removeCheckpointBlip,
  removeCheckpointHolo,
} from "../../track/client/checkpoint.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {startDisablingTraffic, stopDisablingTraffic} from "../../traffic/client/traffic.ts";
import {placeProp, PROP_PLACEMENT_DEFAULTS, removeProp} from "../../track/client/prop.ts";
import {FIXTURE_REMOVAL_DEFAULTS, hideFixture, unhideFixture} from "../../track/client/fixture.ts";
import {distanceBetweenVector3s, Vector3} from "../../util/common/vector.ts";
import {Fixture, PlaceableProp, PrimaryCheckpoint, TrackMetadata} from "../../track/common/track.ts";
import {wait} from "../../util/common/util.ts";
import {HOTLAP_COMMANDS} from "../common/command.ts";

// TODO in case a player spawns onto a custom track, the props in immediate radius of the spawn point need to
//  be loaded and placed first

// TODO check player fps during hotlap using
//  GetFrameTime: https://docs.fivem.net/natives/?_0x15C40837039FFAF7
//  or GetFrameCount: https://docs.fivem.net/natives/?_0x15C40837039FFAF7

const log = new ConsoleLogger(PACKAGE_NAME);
const hotlapState = new ClientHotlapState();

// TODO consider including playerCoords in ClientHotlapState, or own ClientGenericState
let playerCoords: Vector3 | undefined;
let tickUpdatePlayerCoords: number | undefined;

// start general ticks right away
startTickUpdatingPlayerCoords(10);

// hard-coded command for now
RegisterCommand(
  HOTLAP_COMMANDS.HOTLAP,
  async (source: number, args: string[]) => handleHotlapCommand(args),
  false
);

async function handleHotlapCommand(args: string[]) {
  if (isNaN(Number(args[0])) && ('quit' === args[0] || 'stop' === args[0])) {
    await quitHotlapSession();
  } else if (!isNaN(Number(args[0]))) {
    await quitHotlapSession();
    await initializeHotlapSession(Number(args[0]));
  } else {
    log.warn(
      `Unknown argument '${args[0]}'! Please enter either a track id to `
      + `start a session, or 'quit' to quit an active session`
    );
  }
}

async function initializeHotlapSession(trackId: number) {
  if (hotlapState.currentlyCleaningUp) {
    log.warn(`Waiting for current session to be cleaned up, please try again in a moment`);
    return;
  }

  log.info(`Starting hotlap session for track ${trackId}...`);

  // clean up before starting
  await resetHotlapState();

  // disable traffic
  if (undefined !== playerCoords) {
    await startDisablingTraffic();
  } else {
    log.warn(`Failed to disable traffic (current player coords are undefined)`);
  }

  log.debug(`ClientHotlapState before initializing: ${JSON.stringify(hotlapState)}`);

  hotlapState.status = HotlapStatus.REQUESTING_TRACK;
  hotlapState.trackId = trackId;

  log.info(`Initializing hotlap session - requesting track ${trackId} from server...`);

  emitNet(EVENTS.HOTLAP.TRACK.REQUESTED, trackId);
}

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.METADATA, async (rawMetadata: string) => {
  const metadata: TrackMetadata = JSON.parse(rawMetadata);
  hotlapState.trackMetadata = metadata;

  log.debug(`Received track metadata: ${JSON.stringify(metadata)}`);
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.CHECKPOINTS, async (initialCps: string) => {
  let checkpoints: PrimaryCheckpoint[] | undefined = undefined;

  try {
    checkpoints = JSON.parse(initialCps);
  } catch (err) {
    log.error(`Failed to parse provided checkpoints: ${err}`);
  }

  if (undefined === checkpoints) {
    log.error(`Failed to setup initial checkpoints: parsed checkpoints undefined`);
    hotlapState.hasCheckpointPlacementError = true;
    return;
  }

  await setupNextCheckpointState(checkpoints[1]);
  await setupCurrentCheckpointState(checkpoints[0]);

  hotlapState.ticks.calculateDistanceToCheckpoint.start(calculateDistanceToCheckpoint);
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.STATIC, async (rawStaticProps: string) => {
  hotlapState.status = HotlapStatus.ACTIVE;
  const staticProps: PlaceableProp[] = JSON.parse(rawStaticProps);

  if (undefined === staticProps || staticProps.length === 0) {
    log.debug(`Received no static props to place`);
    return;
  }

  log.debug(`Received ${staticProps.length} static props to place`);
  staticProps.forEach((prop) =>
    hotlapState.staticProps.push({
      hash: prop.hash,
      coords: prop.coords,
      isDynamic: prop.isDynamic,
      rotation: prop.rotation,
      isCollidable: prop.isCollidable,
      textureVariant: prop.textureVariant,
      lodDistance: prop.lodDistance,
      placed: false
    })
  );

  hotlapState.ticks.placeStaticPropsNearPlayer.start(
    placeStaticPropsWithinPlayerRadius,
    PROP_PLACEMENT_DEFAULTS.DETECTION.INTERVAL_MS
  );
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.DYNAMIC, async (rawDynamicProps: string) => {
  hotlapState.status = HotlapStatus.ACTIVE;
  const dynamicProps: PlaceableProp[] = JSON.parse(rawDynamicProps);

  if (undefined === dynamicProps || dynamicProps.length === 0) {
    log.debug(`Received no dynamic props to place`);
    return;
  }

  log.debug(`Received ${dynamicProps.length} dynamic props to place`);
  dynamicProps.forEach((prop) =>
    hotlapState.staticProps.push({
      hash: prop.hash,
      coords: prop.coords,
      isDynamic: prop.isDynamic,
      rotation: prop.rotation,
      isCollidable: prop.isCollidable,
      textureVariant: prop.textureVariant,
      lodDistance: prop.lodDistance,
      placed: false
    })
  );

  hotlapState.ticks.placeDynamicPropsNearPlayer.start(
    placeDynamicPropsNearPlayer,
    PROP_PLACEMENT_DEFAULTS.DETECTION.INTERVAL_MS
  );
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.FIXTURES, async (rawFixtures: string) => {
  hotlapState.status = HotlapStatus.ACTIVE;
  const fixtures: Fixture[] = JSON.parse(rawFixtures);

  if (undefined === fixtures || fixtures.length === 0) {
    log.debug(`Received no fixtures to remove`);
    return;
  }

  log.debug(`Received ${fixtures.length} fixtures to place`);
  for (const fixture of fixtures) {
    hotlapState.fixtures.push({
      hash: fixture.hash,
      coords: fixture.coords,
      radius: fixture.radius,
      hidden: false
    });
  }

  hotlapState.ticks.removeFixturesNearPlayer.start(
    removeFixturesNearPlayer,
    FIXTURE_REMOVAL_DEFAULTS.DETECTION.INTERVAL_MS
  );
});

onNet(EVENTS.HOTLAP.ACTIVE.NEXT_CHECKPOINT.RECEIVED, async (nextCp: string) => {
  // note: this next checkpoint does not refer to the immediate next cp.
  // up until now, the current and next checkpoint are being displayed. with this event triggered, the current cp
  // will be removed, the next cp will be moved to the current cp, and THIS next cp will be the state's new next
  // cp. confusing naming, I know
  let newNextCheckpoint: PrimaryCheckpoint | undefined = undefined;

  try {
    newNextCheckpoint = JSON.parse(nextCp);
  } catch (err) {
    log.error(`Failed to parse new next checkpoint: ${err}`);
  }

  if (undefined === newNextCheckpoint) {
    log.error(`Failed to setup new NextCheckpointState: received next checkpoint is undefined`);
    return;
  }

  const oldNextCp = hotlapState.nextCp;

  log.debug(`Received new next checkpoint ${JSON.stringify(newNextCheckpoint?.coords)}`);
  await setupNextCheckpointState(newNextCheckpoint);

  if (undefined !== oldNextCp) {
    await setupCurrentCheckpointState(oldNextCp);
  }

  hotlapState.hasAlreadyRequestedNextCheckpoint = false;
});

onNet(EVENTS.HOTLAP.ACTIVE.LAP, async () => {
  hotlapState.lap.currentLap += 1;

  // if no laptime is being recorded yet: start doing so
  if (!hotlapState.ticks.updateLapTimer.isRunning()) {
    hotlapState.ticks.updateLapTimer.start(updateLapTimer);
  }
});

function startTickUpdatingPlayerCoords(intervalMs: number) {
  tickUpdatePlayerCoords = setTick(async () => {
    const [ x, y, z ] = GetEntityCoords(PlayerPedId(), false);
    if (undefined === playerCoords) {
      playerCoords = { x: x, y: y, z: z };
    } else {
      playerCoords.x = x;
      playerCoords.y = y;
      playerCoords.z = z;
    }
    await wait(intervalMs);
  });
  log.info(`Started updating player coordinates every ${intervalMs === 0 ? 'frame' : intervalMs + ' ms'}`);
}

async function placeStaticPropsWithinPlayerRadius() {
  if (undefined === playerCoords || !hotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const prop of hotlapState.staticProps) {
    const propNeedsToBePlaced = !prop.placed
      && distanceBetweenVector3s(prop.coords, playerCoords) <= PROP_PLACEMENT_DEFAULTS.DETECTION.RADIUS;

    if (propNeedsToBePlaced) {
      try {
        prop.ref = await placeProp(prop);
        prop.placed = true;
        log.trace(
          `Placed static prop (hash=${prop.hash})`
          + ` at x=${prop.coords.x}, y=${prop.coords.y}, z=${prop.coords.z}`
        );
      } catch (error) {
        log.warn(`Failed to place static prop ${prop.hash} at ${JSON.stringify(prop.coords)}: ${error}`);
      }
    }
  }
}

async function placeDynamicPropsNearPlayer() {
  if (undefined === playerCoords || !hotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const prop of hotlapState.dynamicProps) {
    const propNeedsToBePlaced = !prop.placed
      && distanceBetweenVector3s(prop.coords, playerCoords) <= PROP_PLACEMENT_DEFAULTS.DETECTION.RADIUS;

    if (propNeedsToBePlaced) {
      try {
        prop.ref = await placeProp(prop);
        prop.placed = true;
        log.trace(
          `Placed dynamic prop (hash=${prop.hash})`
          + ` at x=${prop.coords.x}, y=${prop.coords.y}, z=${prop.coords.z}`);
      } catch (error) {
        log.warn(`Failed to place dynamic prop ${prop.hash} at ${JSON.stringify(prop.coords)}: ${error}`);
      }
    }
  }
}

async function removeFixturesNearPlayer() {
  if (undefined === playerCoords || !hotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const fixture of hotlapState.fixtures) {
    const fixtureNeedsToBeRemoved = !fixture.hidden
      && distanceBetweenVector3s(fixture.coords, playerCoords) <= FIXTURE_REMOVAL_DEFAULTS.DETECTION.RADIUS;

    if (fixtureNeedsToBeRemoved) {
      try {
        fixture.hidden = await hideFixture(fixture);
        log.trace(
          `Removed fixture (hash=${fixture.hash}) with radius=${fixture.radius}`
          + ` at x=${fixture.coords.x}, y=${fixture.coords.y}, z=${fixture.coords.z}`
        );
      } catch (error) {
        log.warn(`Failed to remove fixture ${fixture.hash} at ${JSON.stringify(fixture.coords)}: ${error}`);
      }
    }
  }
}

function calculateDistanceToCheckpoint() {
  let distance = Number.MAX_SAFE_INTEGER;

  if (undefined !== playerCoords && undefined !== hotlapState.currentCp) {
    distance = distanceBetweenVector3s(hotlapState.currentCp?.coords, playerCoords);

    if (undefined !== hotlapState.currentCp?.secondaryCheckpoint) {
      const distanceToSecondaryHolo = distanceBetweenVector3s(
        hotlapState.currentCp?.secondaryCheckpoint.coords,
        playerCoords
      );
      if (distanceToSecondaryHolo < distance) {
        distance = distanceToSecondaryHolo;
      }
    }

    hotlapState.playerDistanceToCurrentCp = distance;
  }

  const isPlayerTouchingCurrentCp = undefined !== hotlapState.currentCp?.size
    && undefined !== hotlapState.playerDistanceToCurrentCp
    && distance <= (hotlapState.currentCp?.size * CHECKPOINT_DEFAULTS.HOLO.INVISIBLE_TRIGGER_EXTEND);

  if (isPlayerTouchingCurrentCp && !hotlapState.hasAlreadyRequestedNextCheckpoint) {
    log.debug(`Player has touched current checkpoint - requesting next one from server`);
    emitNet(EVENTS.HOTLAP.ACTIVE.NEXT_CHECKPOINT.REQUESTED);
    hotlapState.hasAlreadyRequestedNextCheckpoint = true;
  }
}

async function setupNextCheckpointState(cpData: PrimaryCheckpoint) {
  // clear currently set current cp from map (blip + holo)
  if (undefined !== hotlapState.nextCp?.blip) {
    await removeCheckpointBlip(hotlapState.nextCp?.blip);
  }

  // setup next cp first
  try {
    const nextCpBlip = await drawCheckpointBlip(cpData.coords, false);

    hotlapState.nextCp = {
      coords: cpData.coords,
      heading: cpData.heading,
      size: cpData.size,
      specialTypes: cpData.specialTypes,
      planeRotation: cpData.planeRotation,
      secondaryCheckpoint: cpData.secondaryCheckpoint,
      isTransform: cpData.isTransform,
      isRandom: cpData.isRandom,
      blip: nextCpBlip
    };
  } catch (error) {
    log.warn(`Failed to setup initial next checkpoint: ${error}`);
  }
}

async function setupCurrentCheckpointState(cpData: PrimaryCheckpoint) {
  // clear currently set current cp from map (blip + holo)
  if (undefined !== hotlapState.currentCp) {
    const holos = hotlapState.currentCp?.holos;
    for (const holo of holos) {
      await removeCheckpointHolo(holo);
    }
    if (undefined !== hotlapState.currentCp?.blip) {
      await removeCheckpointBlip(hotlapState.currentCp?.blip);
    }
  }

  // setup new current checkpoint state
  try {
    const newBlip = await drawCheckpointBlip(cpData.coords, true);

    const nextCpCoords = hotlapState.nextCp?.coords;
    if (undefined === nextCpCoords) {
      throw new Error(`Next checkpoint's coords undefined`);
    }

    const currentCpHolos: number[] = [];
    const currentCpPrimaryHolo = await drawCheckpointHolo(cpData.coords, cpData.size, nextCpCoords, false);
    if (undefined !== currentCpPrimaryHolo) {
      currentCpHolos.push(currentCpPrimaryHolo);
    }

    const currentCpSecondaryHolo = undefined === cpData.secondaryCheckpoint
      ? undefined
      : await drawCheckpointHolo(cpData.secondaryCheckpoint?.coords, cpData.size, nextCpCoords, true);

    if (undefined !== currentCpSecondaryHolo) {
      currentCpHolos.push(currentCpSecondaryHolo);
    }

    hotlapState.currentCp = {
      coords: cpData.coords,
      heading: cpData.heading,
      size: cpData.size,
      specialTypes: cpData.specialTypes,
      planeRotation: cpData.planeRotation,
      secondaryCheckpoint: cpData.secondaryCheckpoint,
      isTransform: cpData.isTransform,
      isRandom: cpData.isRandom,
      blip: newBlip,
      holos: currentCpHolos
    };
  } catch (error) {
    log.warn(`Encountered error whilst trying to set up CurrentCheckpointState: ${error}`);
  }
}

function updateLapTimer() {
  // TODO implement updateLapTimer()
}

async function quitHotlapSession() {
  if (hotlapState.isPlayerNotInFreeMode()) {
    log.info(`Quitting hotlap session...`);
    hotlapState.status = HotlapStatus.QUITTING;
    await resetHotlapState();
    emitNet(EVENTS.HOTLAP.QUIT, []);
  } else {
    log.info(`Cannot quit hotlap session - currently not in a session`);
  }
}

async function resetHotlapState() {
  if (undefined === hotlapState) {
    return;
  }

  log.info(`Resetting hotlap state...`);
  hotlapState.currentlyCleaningUp = true;

  hotlapState.ticks.removeFixturesNearPlayer.stop();
  hotlapState.ticks.placeDynamicPropsNearPlayer.stop();
  hotlapState.ticks.placeStaticPropsNearPlayer.stop();
  hotlapState.ticks.calculateDistanceToCheckpoint.stop();
  hotlapState.ticks.updateLapTimer.stop();

  stopDisablingTraffic();

  if (hotlapState.fixtures.length === 0) {
    log.debug(`Found no fixtures to unhide`);
  } else {
    log.debug(`Unhiding ${hotlapState.fixtures.length} fixtures...`);
    hotlapState.fixtures.forEach((f) => {
      if (f.hidden) {
        unhideFixture(f)
          .then(() => f.hidden = false)
          .catch((err) => {
            log.warn(
              `Failed to unhide fixture (hash=${f.hash}, radius=${f.radius}, `
              + `x=${f.coords.x}, y=${f.coords.y}, z=${f.coords.z}): ${err}`
            );
            hotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (hotlapState.dynamicProps.length === 0) {
    log.debug(`Found no dynamic props to remove`);
  } else {
    log.debug(`Removing ${hotlapState.dynamicProps.length} props...`);
    hotlapState.dynamicProps.forEach(dp => {
      if (undefined !== dp.ref && dp.placed) {
        removeProp(dp.ref)
          .then(() => dp.placed = false)
          .catch((err) => {
            log.warn(
              `Failed to delete dynamic prop (hash=${dp.hash}, `
              + `x=${dp.coords.x}, y=${dp.coords.y}, z=${dp.coords.z}): ${err}`
            );
            hotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (hotlapState.staticProps.length === 0) {
    log.debug(`Found no static props to remove`);
  } else {
    log.debug(`Removing static props...`);
    hotlapState.staticProps.forEach(sp => {
      if (undefined !== sp.ref && sp.placed) {
        removeProp(sp.ref)
          .then(() => sp.placed = false)
          .catch((err) => {
            log.warn(
              `Failed to delete static prop (hash=${sp.hash}, `
              + `x=${sp.coords.x}, y=${sp.coords.y}, z=${sp.coords.z}): ${err}`
            );
            hotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (hotlapState.hasTrackCleanupError) {
    log.error(`Failed to clean up all track props and fixtures!`);
    log.error(`Some props may still be visible and some fixture may still be hidden!`);
    log.error(`Server will kick you in 10 seconds to hard-reset this illegal state!`);
    // TODO perform server kick
    return;
  }

  if (undefined !== hotlapState.nextCp?.blip) {
    await removeCheckpointBlip(hotlapState.nextCp?.blip);
  }

  if (undefined !== hotlapState.currentCp?.blip) {
    await removeCheckpointBlip(hotlapState.currentCp?.blip);
  }

  hotlapState.currentCp?.holos.forEach((holo: number) => removeCheckpointHolo(holo));

  hotlapState.fixtures = [];
  hotlapState.dynamicProps = [];
  hotlapState.staticProps = [];
  hotlapState.nextCp = undefined;
  hotlapState.currentCp = undefined;
  hotlapState.trackMetadata = undefined;
  hotlapState.trackId = undefined;
  hotlapState.status = HotlapStatus.FREE_MODE;

  log.info(`Successfully finished resetting hotlap state`);
  hotlapState.currentlyCleaningUp = false;
}
