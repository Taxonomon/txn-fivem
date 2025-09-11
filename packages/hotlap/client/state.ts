import {TrackMetadata} from "../common/hotlap/type.ts";
import {CurrentCheckpointState, FixtureState, NextCheckpointState, PropState} from "./type.ts";

export enum HotlapStatus {
  FREE_MODE,
  REQUESTING_TRACK,
  PLACING_TRACK
}

export class TickState {
  updateStaticPropsWithinPlayerRadius?: number;
  updateDynamicPropsWithinPlayerRadius?: number;
  updateFixturesWithinPlayerRadius?: number;
  updatePlayerDistanceToCurrentCheckpoint?: number;
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
  ticks: TickState = new TickState();
  currentlyCleaningUp: boolean = false;
  hasAlreadyRequestedNextCheckpoint: boolean = false;

  isPlayerNotInFreeMode() {
    return this.status !== HotlapStatus.FREE_MODE;
  }
}
