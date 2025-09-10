import {Fixture, PlaceableProp, PrimaryCheckpoint} from "../../common/hotlap/type";

export type NextCheckpointState = PrimaryCheckpoint & {
  blip: number;
};

export type CurrentCheckpointState = NextCheckpointState & {
  holos: number[];
};

export type PropState = PlaceableProp & {
  placed: boolean;
  ref?: number;
};

export type FixtureState = Fixture & {
  hidden: boolean;
};
