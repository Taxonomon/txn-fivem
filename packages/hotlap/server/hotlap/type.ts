import {Track} from "../../common/hotlap/type.ts";

export type CachedTrack = {
  trackId: number,
  created: number,
  track: Track
};

export type HotlappingPlayer = {
  playerId: number,
  trackId: number,
  /**
   * The index of the last checkpoint the client has touched.
   *
   * If the client is just starting a hotlap session, this will be set to the last checkpoint before
   * the start/fin line.
   */
  checkpoint: number
};
