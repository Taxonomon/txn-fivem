import {clientHotlapState, HotlapStatus} from "./state.ts";
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
import {distanceBetweenVector3s} from "../../util/common/vector.ts";
import {Fixture, PlaceableProp, PrimaryCheckpoint, TrackMetadata} from "../../track/common/track.ts";
import {HOTLAP_COMMANDS} from "../common/command.ts";
import {toggleHotlapUIElements, updateUIAverageLap, updateUILapTimer, updateUILastLap} from "../../ui/client/ui.ts";
import {formatTimestampToDisplayTime} from "../../ui/client/util.ts";
import {CLIENT_RESOURCE_EVENTS} from "../../util/common/event.ts";
import {commonClientState} from "../../util/client/state.ts";

// TODO in case a player spawns onto a custom track, the props in immediate radius of the spawn point need to
//  be loaded and placed first

// TODO check player fps during hotlap using
//  GetFrameTime: https://docs.fivem.net/natives/?_0x15C40837039FFAF7
//  or GetFrameCount: https://docs.fivem.net/natives/?_0x15C40837039FFAF7

const log = new ConsoleLogger(PACKAGE_NAME);

on(CLIENT_RESOURCE_EVENTS.ON_RESOURCE_START, () => {
  // hard-coded command for now
  RegisterCommand(
    HOTLAP_COMMANDS.HOTLAP,
    async (source: number, args: string[]) => handleHotlapCommand(args),
    false
  );
});

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
  if (clientHotlapState.currentlyCleaningUp) {
    log.warn(`Waiting for current session to be cleaned up, please try again in a moment`);
    return;
  }

  log.info(`Starting hotlap session for track ${trackId}...`);

  // clean up before starting
  await resetHotlapState();

  // disable traffic
  if (undefined !== commonClientState.playerCoords) {
    await startDisablingTraffic();
  } else {
    log.warn(`Failed to disable traffic (current player coords are undefined)`);
  }

  // update hotlap status
  clientHotlapState.status = HotlapStatus.REQUESTING_TRACK;
  clientHotlapState.trackId = trackId;

  // toggle hotlap UI
  toggleHotlapUIElements(true);

  log.info(`Initializing hotlap session - requesting track ${trackId} from server...`);

  emitNet(EVENTS.HOTLAP.TRACK.REQUESTED, trackId);
}

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.METADATA, async (rawMetadata: string) => {
  const metadata: TrackMetadata = JSON.parse(rawMetadata);
  clientHotlapState.trackMetadata = metadata;

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
    clientHotlapState.hasCheckpointPlacementError = true;
    return;
  }

  await setupNextCheckpointState(checkpoints[1]);
  await setupCurrentCheckpointState(checkpoints[0]);

  clientHotlapState.ticks.calculateDistanceToCheckpoint.start(calculateDistanceToCheckpoint);
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.STATIC, async (rawStaticProps: string) => {
  clientHotlapState.status = HotlapStatus.ACTIVE;
  const staticProps: PlaceableProp[] = JSON.parse(rawStaticProps);

  if (undefined === staticProps || staticProps.length === 0) {
    log.debug(`Received no static props to place`);
    return;
  }

  log.debug(`Received ${staticProps.length} static props to place`);
  staticProps.forEach((prop) =>
    clientHotlapState.staticProps.push({
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

  clientHotlapState.ticks.placeStaticPropsNearPlayer.start(
    placeStaticPropsWithinPlayerRadius,
    PROP_PLACEMENT_DEFAULTS.DETECTION.INTERVAL_MS
  );
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.DYNAMIC, async (rawDynamicProps: string) => {
  clientHotlapState.status = HotlapStatus.ACTIVE;
  const dynamicProps: PlaceableProp[] = JSON.parse(rawDynamicProps);

  if (undefined === dynamicProps || dynamicProps.length === 0) {
    log.debug(`Received no dynamic props to place`);
    return;
  }

  log.debug(`Received ${dynamicProps.length} dynamic props to place`);
  dynamicProps.forEach((prop) =>
    clientHotlapState.staticProps.push({
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

  clientHotlapState.ticks.placeDynamicPropsNearPlayer.start(
    placeDynamicPropsNearPlayer,
    PROP_PLACEMENT_DEFAULTS.DETECTION.INTERVAL_MS
  );
});

onNet(EVENTS.HOTLAP.TRACK.PROVIDED.FIXTURES, async (rawFixtures: string) => {
  clientHotlapState.status = HotlapStatus.ACTIVE;
  const fixtures: Fixture[] = JSON.parse(rawFixtures);

  if (undefined === fixtures || fixtures.length === 0) {
    log.debug(`Received no fixtures to remove`);
    return;
  }

  log.debug(`Received ${fixtures.length} fixtures to place`);
  for (const fixture of fixtures) {
    clientHotlapState.fixtures.push({
      hash: fixture.hash,
      coords: fixture.coords,
      radius: fixture.radius,
      hidden: false
    });
  }

  clientHotlapState.ticks.removeFixturesNearPlayer.start(
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

  const oldNextCp = clientHotlapState.nextCp;

  log.debug(`Received new next checkpoint ${JSON.stringify(newNextCheckpoint?.coords)}`);
  await setupNextCheckpointState(newNextCheckpoint);

  if (undefined !== oldNextCp) {
    await setupCurrentCheckpointState(oldNextCp);
  }

  clientHotlapState.hasAlreadyRequestedNextCheckpoint = false;
});

onNet(EVENTS.HOTLAP.ACTIVE.LAP, async () => {
  if (!clientHotlapState.ticks.updateLapTimer.isRunning()) {
    // if no lap has been started yet: start lap timer
    clientHotlapState.ticks.updateLapTimer.start(updateLapTimer, 10);
  } else {
    // else: process finished lap
    clientHotlapState.numberOfCompletedLaps += 1;
    processFinishedLap();
  }

  // finally: reset lap timer
  clientHotlapState.lapStartedTimestamp = GetGameTimer();
});

function processFinishedLap() {
  if (undefined === clientHotlapState.lapStartedTimestamp
    || undefined === clientHotlapState.checkpointLastTouchedTimestampMs
  ) {
    log.error(`Failed to process finished lap: timestamp of lap start is undefined`);
    return;
  }

  const lapTimeMs = clientHotlapState.checkpointLastTouchedTimestampMs - clientHotlapState.lapStartedTimestamp;
  const timestampTimeSet = Date.now();

  console.debug(`Lap time ms: ${lapTimeMs}`);
  clientHotlapState.lapTimes.push(lapTimeMs);

  updateAverageLapTime();
  updateUILastLap(formatTimestampToDisplayTime(lapTimeMs, lapTimeMs >= 3600000, true));

  // TODO send to server to check if pb and lr
}

function updateAverageLapTime() {
  let totalTime = 0;
  // TODO check if integer overflow can occur if adding too many laps
  clientHotlapState.lapTimes.forEach((lapTime) => totalTime += lapTime);
  const avgLapMs = totalTime / clientHotlapState.numberOfCompletedLaps;

  console.debug(`Avg lap ms: ${avgLapMs} (after ${clientHotlapState.numberOfCompletedLaps} laps)`);

  clientHotlapState.averageLap = avgLapMs;
  updateUIAverageLap(formatTimestampToDisplayTime(avgLapMs, avgLapMs >= 3600000, true));
}

async function placeStaticPropsWithinPlayerRadius() {
  if (undefined === commonClientState.playerCoords || !clientHotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const prop of clientHotlapState.staticProps) {
    const propNeedsToBePlaced = !prop.placed
      && distanceBetweenVector3s(
        prop.coords,
        commonClientState.playerCoords
      ) <= PROP_PLACEMENT_DEFAULTS.DETECTION.RADIUS;

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
  if (undefined === commonClientState.playerCoords || !clientHotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const prop of clientHotlapState.dynamicProps) {
    const propNeedsToBePlaced = !prop.placed
      && distanceBetweenVector3s(
        prop.coords,
        commonClientState.playerCoords
      ) <= PROP_PLACEMENT_DEFAULTS.DETECTION.RADIUS;

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
  if (undefined === commonClientState.playerCoords || !clientHotlapState.isPlayerNotInFreeMode()) {
    return;
  }

  for (const fixture of clientHotlapState.fixtures) {
    const fixtureNeedsToBeRemoved = !fixture.hidden
      && distanceBetweenVector3s(
        fixture.coords,
        commonClientState.playerCoords
      ) <= FIXTURE_REMOVAL_DEFAULTS.DETECTION.RADIUS;

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

  if (undefined !== commonClientState.playerCoords && undefined !== clientHotlapState.currentCp) {
    distance = distanceBetweenVector3s(clientHotlapState.currentCp?.coords, commonClientState.playerCoords);

    if (undefined !== clientHotlapState.currentCp?.secondaryCheckpoint) {
      const distanceToSecondaryHolo = distanceBetweenVector3s(
        clientHotlapState.currentCp?.secondaryCheckpoint.coords,
        commonClientState.playerCoords
      );
      if (distanceToSecondaryHolo < distance) {
        distance = distanceToSecondaryHolo;
      }
    }

    clientHotlapState.playerDistanceToCurrentCp = distance;
  }

  // TODO move logic that checks whether client is touching current cp to separate function/tick
  const isPlayerTouchingCurrentCp = undefined !== clientHotlapState.currentCp?.size
    && undefined !== clientHotlapState.playerDistanceToCurrentCp
    && distance <= (clientHotlapState.currentCp?.size * CHECKPOINT_DEFAULTS.HOLO.INVISIBLE_TRIGGER_EXTEND);

  if (isPlayerTouchingCurrentCp && !clientHotlapState.hasAlreadyRequestedNextCheckpoint) {
    log.debug(`Player has touched current checkpoint - requesting next one from server`);
    emitNet(EVENTS.HOTLAP.ACTIVE.NEXT_CHECKPOINT.REQUESTED);
    clientHotlapState.checkpointLastTouchedTimestampMs = GetGameTimer();
    clientHotlapState.hasAlreadyRequestedNextCheckpoint = true;
  }
}

async function setupNextCheckpointState(cpData: PrimaryCheckpoint) {
  // clear currently set current cp from map (blip + holo)
  if (undefined !== clientHotlapState.nextCp?.blip) {
    await removeCheckpointBlip(clientHotlapState.nextCp?.blip);
  }

  // setup next cp first
  try {
    const nextCpBlip = await drawCheckpointBlip(cpData.coords, false);

    clientHotlapState.nextCp = {
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
  if (undefined !== clientHotlapState.currentCp) {
    const holos = clientHotlapState.currentCp?.holos;
    for (const holo of holos) {
      await removeCheckpointHolo(holo);
    }
    if (undefined !== clientHotlapState.currentCp?.blip) {
      await removeCheckpointBlip(clientHotlapState.currentCp?.blip);
    }
  }

  // setup new current checkpoint state
  try {
    const newBlip = await drawCheckpointBlip(cpData.coords, true);

    const nextCpCoords = clientHotlapState.nextCp?.coords;
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

    clientHotlapState.currentCp = {
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
  if (undefined === clientHotlapState.lapStartedTimestamp) {
    log.error(`Failed to update lap timer: timestamp when lap was started is undefined`);
    return;
  }
  const timePassedMs = GetGameTimer() - clientHotlapState.lapStartedTimestamp
  updateUILapTimer(formatTimestampToDisplayTime(
    timePassedMs,
    timePassedMs >= 3600000, // 1 hour in ms
    true // always show minutes
  ));
}

async function quitHotlapSession() {
  if (clientHotlapState.isPlayerNotInFreeMode()) {
    log.info(`Quitting hotlap session...`);

    clientHotlapState.status = HotlapStatus.QUITTING;
    toggleHotlapUIElements(false);

    await resetHotlapState();

    emitNet(EVENTS.HOTLAP.QUIT, []);
  } else {
    log.info(`Cannot quit hotlap session - currently not in a session`);
  }
}

async function resetHotlapState() {
  if (undefined === clientHotlapState) {
    return;
  }

  log.info(`Resetting hotlap state...`);
  clientHotlapState.currentlyCleaningUp = true;

  clientHotlapState.ticks.removeFixturesNearPlayer.stop();
  clientHotlapState.ticks.placeDynamicPropsNearPlayer.stop();
  clientHotlapState.ticks.placeStaticPropsNearPlayer.stop();
  clientHotlapState.ticks.calculateDistanceToCheckpoint.stop();
  clientHotlapState.ticks.updateLapTimer.stop();

  stopDisablingTraffic();

  if (clientHotlapState.fixtures.length === 0) {
    log.debug(`Found no fixtures to unhide`);
  } else {
    log.debug(`Unhiding ${clientHotlapState.fixtures.length} fixtures...`);
    clientHotlapState.fixtures.forEach((f) => {
      if (f.hidden) {
        unhideFixture(f)
          .then(() => f.hidden = false)
          .catch((err) => {
            log.warn(
              `Failed to unhide fixture (hash=${f.hash}, radius=${f.radius}, `
              + `x=${f.coords.x}, y=${f.coords.y}, z=${f.coords.z}): ${err}`
            );
            clientHotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (clientHotlapState.dynamicProps.length === 0) {
    log.debug(`Found no dynamic props to remove`);
  } else {
    log.debug(`Removing ${clientHotlapState.dynamicProps.length} props...`);
    clientHotlapState.dynamicProps.forEach(dp => {
      if (undefined !== dp.ref && dp.placed) {
        removeProp(dp.ref)
          .then(() => dp.placed = false)
          .catch((err) => {
            log.warn(
              `Failed to delete dynamic prop (hash=${dp.hash}, `
              + `x=${dp.coords.x}, y=${dp.coords.y}, z=${dp.coords.z}): ${err}`
            );
            clientHotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (clientHotlapState.staticProps.length === 0) {
    log.debug(`Found no static props to remove`);
  } else {
    log.debug(`Removing static props...`);
    clientHotlapState.staticProps.forEach(sp => {
      if (undefined !== sp.ref && sp.placed) {
        removeProp(sp.ref)
          .then(() => sp.placed = false)
          .catch((err) => {
            log.warn(
              `Failed to delete static prop (hash=${sp.hash}, `
              + `x=${sp.coords.x}, y=${sp.coords.y}, z=${sp.coords.z}): ${err}`
            );
            clientHotlapState.hasTrackCleanupError = true;
          });
      }
    });
  }

  if (clientHotlapState.hasTrackCleanupError) {
    log.error(`Failed to clean up all track props and fixtures!`);
    log.error(`Some props may still be visible and some fixture may still be hidden!`);
    log.error(`Server will kick you in 10 seconds to hard-reset this illegal state!`);
    // TODO perform server kick
    return;
  }

  if (undefined !== clientHotlapState.nextCp?.blip) {
    await removeCheckpointBlip(clientHotlapState.nextCp?.blip);
  }

  if (undefined !== clientHotlapState.currentCp?.blip) {
    await removeCheckpointBlip(clientHotlapState.currentCp?.blip);
  }

  clientHotlapState.currentCp?.holos.forEach((holo: number) => removeCheckpointHolo(holo));

  clientHotlapState.fixtures = [];
  clientHotlapState.dynamicProps = [];
  clientHotlapState.staticProps = [];
  clientHotlapState.nextCp = undefined;
  clientHotlapState.currentCp = undefined;
  clientHotlapState.trackMetadata = undefined;
  clientHotlapState.trackId = undefined;
  clientHotlapState.status = HotlapStatus.FREE_MODE;
  clientHotlapState.lapStartedTimestamp = undefined;
  clientHotlapState.numberOfCompletedLaps = 0;
  clientHotlapState.lapTimes = [];
  clientHotlapState.lastLap = undefined;
  clientHotlapState.averageLap = undefined;
  clientHotlapState.personalBestLap = undefined;
  clientHotlapState.lapRecord = undefined;

  log.info(`Successfully finished resetting hotlap state`);
  clientHotlapState.currentlyCleaningUp = false;
}
