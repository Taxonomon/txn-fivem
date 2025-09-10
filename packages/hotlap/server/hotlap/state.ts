import {CachedTrack, HotlappingPlayer} from "./type";

export class ServerHotlapState {
  cachedTracks: CachedTrack[] = [];
  playersCurrentlyHotlapping: HotlappingPlayer[] = [];
  // TODO clear remove player from playersCurrentlyHotlapping when they disconnect without quitting their hotlap session
}

