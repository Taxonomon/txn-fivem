import {CurrentCheckpointState, FixtureState, NextCheckpointState, PropState} from "./type.ts";
import {TrackMetadata} from "../../track/common/track.ts";
import {Tick} from "../../util/common/tick.ts";

export enum HotlapStatus {
  FREE_MODE,
  REQUESTING_TRACK,
  ACTIVE,
  QUITTING
}

export class TickState {
  placeStaticPropsNearPlayer = new Tick('place static props near player');
  placeDynamicPropsNearPlayer = new Tick('place dynamic props near player');
  removeFixturesNearPlayer = new Tick('remove fixtures near player');
  calculateDistanceToCheckpoint = new Tick('calculate distance to checkpoint');
  updateLapTimer = new Tick(`update lap timer`);
}

export class LapState {
  // number of the lap the client currently is in
  currentLap: number = 1;

  // lap times
  lastLap?: number;
  averageLap?: number;
  personalBest?: number;
  lapRecord?: number;
}

export class ClientHotlapState {
  status: HotlapStatus = HotlapStatus.FREE_MODE;
  trackId?: number;
  trackMetadata?: TrackMetadata;
  currentCp?: CurrentCheckpointState;
  nextCp?: NextCheckpointState;
  staticProps: PropState[] = [];
  dynamicProps: PropState[] = [];
  fixtures: FixtureState[] = [];
  hasCheckpointPlacementError: boolean = false;
  hasTrackPlacementError: boolean = false;
  hasTrackCleanupError: boolean = false;
  playerDistanceToCurrentCp?: number;
  currentlyCleaningUp: boolean = false;
  hasAlreadyRequestedNextCheckpoint: boolean = false;
  lap: LapState = new LapState();
  ticks: TickState = new TickState();

  isPlayerNotInFreeMode() {
    return this.status !== HotlapStatus.FREE_MODE;
  }
}
