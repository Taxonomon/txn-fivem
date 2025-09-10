import {CpbsType} from "@/common/hotlap/cpbs.ts";
import {CppsstType} from "@/common/hotlap/cppsst.ts";

export type Vector2 = {
  x: number;
  y: number;
};

export type Vector3 = {
  x: number,
  y: number,
  z: number
};

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
