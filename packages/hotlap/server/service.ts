import {ServerHotlapState} from "./state.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {EVENTS} from "../common/event.ts";
import {CachedTrack, HotlappingPlayer} from "./type.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {logErrorToClient, logInfoToClient} from "../../logging/server/log.ts";
import {parseRockstarTrack} from "../../track/server/parse.ts";
import {Track, TrackMetadata} from "../../track/common/track.ts";


const hotlapState = new ServerHotlapState();
const log = new ConsoleLogger(PACKAGE_NAME);
const trackDir = './static/tracks/'; // relative to the resource root

onNet(EVENTS.HOTLAP.TRACK.REQUESTED, (trackId: number) => {
  const requestingPlayerId = source;
  let requestedTrack: Track;

  // check if track exists in cache first
  const cachedTrack: CachedTrack | undefined = hotlapState.cachedTracks.find((entry) =>
    entry.trackId === trackId
  );

  if (undefined !== cachedTrack) {
    requestedTrack = cachedTrack.track;
    log.debug(`Loaded track ${trackId} from server cache`);
  } else {
    // if not, load it from raw JSON, and on success, cache it
    try {
      const rawTrackFileName = `${trackDir}${trackId}.json`;
      const rawTrackString = LoadResourceFile(GetCurrentResourceName(), rawTrackFileName);
      const rawTrackJson = JSON.parse(rawTrackString);

      log.trace(`Loaded '${rawTrackFileName}'? -> ${undefined !== rawTrackJson}`);
      const parsedTrack = parseRockstarTrack(rawTrackJson);

      hotlapState.cachedTracks.push({
        trackId: trackId,
        created: Date.now(),
        track: parsedTrack
      });

      requestedTrack = parsedTrack;
      log.debug(`Loaded track ${trackId} from raw R* JSON`);
    } catch (error) {
      const msg = `Failed to load track ${trackId} from resource files: ${error}`;
      log.error(msg);
      logErrorToClient(msg, requestingPlayerId);
      return;
    }
  }

  const newCurrentlyHotlappingPlayer: HotlappingPlayer = {
    playerId: requestingPlayerId,
    trackId: trackId,
    checkpoint: 0
  };

  hotlapState.playersCurrentlyHotlapping.push(newCurrentlyHotlappingPlayer);
  log.trace(`Added new currently hotlapping player: ${JSON.stringify(newCurrentlyHotlappingPlayer)}`);

  const msg = `Loaded track ${trackId} requested by '${GetPlayerName(requestingPlayerId)}': `
    + `'${requestedTrack.name}' by '${requestedTrack.author}'`;
  log.info(msg);
  logInfoToClient(msg, requestingPlayerId);

  const requestedTrackMetadata: TrackMetadata = {
    name: requestedTrack.name,
    author: requestedTrack.author,
    description: requestedTrack.description,
  };

  // send client separate events for:

  // 1. metadata
  log.debug(`Providing client ${requestingPlayerId} with track metadata...`);
  emitNet(
    EVENTS.HOTLAP.TRACK.PROVIDED.METADATA,
    requestingPlayerId,
    JSON.stringify(requestedTrackMetadata)
  );

  // 2. the first set of checkpoints
  log.debug(`Providing client ${requestingPlayerId} with the first two checkpoints...`);
  emitNet(
    EVENTS.HOTLAP.TRACK.PROVIDED.CHECKPOINTS,
    requestingPlayerId,
    JSON.stringify([
      requestedTrack.checkpoints[0],
      requestedTrack.checkpoints[1]
    ])
  );

  // 3. static props,
  log.debug(`Providing client ${requestingPlayerId} with ${requestedTrack.staticProps.length} static props...`);
  emitNet(
    EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.STATIC,
    requestingPlayerId,
    JSON.stringify(requestedTrack.staticProps)
  );

  // 4. dynamic props,
  log.debug(`Providing client ${requestingPlayerId} with ${requestedTrack.dynamicProps.length} static props...`);
  emitNet(
    EVENTS.HOTLAP.TRACK.PROVIDED.PROPS.DYNAMIC,
    requestingPlayerId,
    JSON.stringify(requestedTrack.dynamicProps)
  );

  // 5. fixtures
  log.debug(`Providing client ${requestingPlayerId} with ${requestedTrack.fixtures.length} fixtures...`);
  emitNet(
    EVENTS.HOTLAP.TRACK.PROVIDED.FIXTURES,
    requestingPlayerId,
    JSON.stringify(requestedTrack.fixtures)
  );

  // the client has to answer to all these events to confirm it is ready
  // 6. finally, the position to spawn the client in
  // (car will be completely ignored for now)
});

onNet(EVENTS.HOTLAP.QUIT, () => {
  // TODO also trigger this when client quits without quitting their hotlap session first
  //  (even though client always implicitly quits their session first when initializing a new one)
  //  (just as a cleanup as to not store leftover hotlap sessions)

  const playerId = source;
  const lengthBeforePurge = hotlapState.playersCurrentlyHotlapping.length;

  // remove player's hotlap session from state
  hotlapState.playersCurrentlyHotlapping = hotlapState.playersCurrentlyHotlapping
    .filter((hotlappingPlayer) => hotlappingPlayer.playerId !== playerId);

  if (lengthBeforePurge === hotlapState.playersCurrentlyHotlapping.length) {
    log.info(`${GetPlayerName(playerId)} emitted event '${EVENTS.HOTLAP.QUIT}' without being in a hotlap session`);
  } else {
    log.info(`Quit hotlap session of ${GetPlayerName(playerId)}`);
  }
});

onNet(EVENTS.HOTLAP.ACTIVE.NEXT_CHECKPOINT.REQUESTED, () => {
  const playerId = source;
  const hotlappingPlayer = hotlapState.playersCurrentlyHotlapping
    .find((hotlappingPlayer) => hotlappingPlayer.playerId === playerId);

  if (undefined === hotlappingPlayer) {
    log.warn(
      `Could not identify server-side hotlap session of '${GetPlayerName(playerId)}' (session is undefined)`
    );
    //TODO tell client that the next cp isn't available
    return;
  }

  const cachedTrack = hotlapState.cachedTracks
    .find((cachedTrack) => cachedTrack.trackId === hotlappingPlayer?.trackId);

  if (undefined === cachedTrack || undefined === cachedTrack?.track) {
    log.warn(
      `Could not find track ${hotlappingPlayer?.trackId} of current hotlap session`
      + `of '${GetPlayerName(playerId)}' (track is undefined)`
    );
    // TODO tell client that the next cp isn't available
    return;
  }

  const currentCpIndex = hotlappingPlayer?.checkpoint;
  log.debug(`'${GetPlayerName(playerId)}' has just passed ${currentCpIndex}`);

  if (0 === currentCpIndex) {
    // client has started/finished their lap
    emitNet(EVENTS.HOTLAP.ACTIVE.LAP, playerId, []);
  }

  const numberOfCps = cachedTrack?.track.checkpoints.length;
  const lastCpIndex = numberOfCps - 1;


  let cpIndexToFetch;

  switch (currentCpIndex) {
    case numberOfCps - 2: {
      cpIndexToFetch = 0;
      break;
    }
    case numberOfCps - 1: {
      cpIndexToFetch = 1;
      break;
    }
    case numberOfCps: {
      cpIndexToFetch = 2;
      break;
    }
    default: {
      cpIndexToFetch = currentCpIndex + 2;
      break;
    }
  }

  log.debug(`Will send '${GetPlayerName(playerId)}' CP ${cpIndexToFetch}`);
  let nextCp = cachedTrack?.track.checkpoints[cpIndexToFetch];

  if (undefined === nextCp) {
    // if still undefined, then the cp could not be loaded
    log.warn(
      `Could not load next checkpoint for '${GetPlayerName(playerId)}'`
      + `hotlap session (checkpoint is undefined)`
    );
    // TODO tell client that the next cp isn't available
    return;
  }

  hotlappingPlayer.checkpoint = currentCpIndex === lastCpIndex ? 0 : currentCpIndex + 1;
  emitNet(EVENTS.HOTLAP.ACTIVE.NEXT_CHECKPOINT.RECEIVED, playerId, JSON.stringify(nextCp));
});
