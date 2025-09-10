import {CpbsType} from "./cpbs.ts";
import {CppsstType} from "./cppsst.ts";
import {Vector3} from "../../util/common/vector.ts";

export type Prop = {
  hash: number,
  coords: Vector3
};

export type PlaceableProp = Prop & {
  isDynamic: boolean,
  rotation: Vector3,
  isCollidable: boolean,
  textureVariant?: number,
  lodDistance?: boolean
};

export type Fixture = Prop & {
  radius: number;
};

export type Checkpoint = {
  coords: Vector3,
  heading: number,
  size: number,
  isTransform: boolean,
  isRandom: boolean
};

export type PrimaryCheckpoint = Checkpoint & {
  specialTypes: CpbsType[],
  planeRotation?: CppsstType,
  secondaryCheckpoint?: SecondaryCheckpoint
};

export type SecondaryCheckpoint = Checkpoint & {};

export type TrackMetadata = {
  name: string,
  author: string,
  description?: string
};

export type Track = TrackMetadata & {
  checkpoints: PrimaryCheckpoint[],
  staticProps: PlaceableProp[],
  dynamicProps: PlaceableProp[],
  fixtures: Fixture[],
};
