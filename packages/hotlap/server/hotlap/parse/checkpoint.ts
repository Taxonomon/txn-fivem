import {ConsoleLogger} from "../../../../logging/common/log";
import {PrimaryCheckpoint} from "../../../common/hotlap/type";
import {
  CPBS1_CHECKPOINT_AIR,
  CPBS1_CHECKPOINT_AIR_SECONDARY,
  CPBS1_CHECKPOINT_ROUND, CPBS1_CHECKPOINT_ROUND_SECONDARY, CPBS_TYPES,
  CpbsType
} from "../../../common/hotlap/cpbs";
import {PARSE_DEFAULTS} from "./default";
import {CPPSST_TYPES, CppsstType} from "../../../common/hotlap/cppsst";
import {isBitSet, isUndefined} from "../../../common/util";
import {PACKAGE_NAME} from "../../../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export function parseCheckpoints(fullTrack: any) {
  const checkpoints: PrimaryCheckpoint[] = [];

  if (isUndefined(fullTrack.mission.race.chp)) {
    log.debug(`No checkpoint data found!`);
    return checkpoints;
  }

  for (let i = 0; i < fullTrack.mission.race.chp; i++) {
    const coords = {
      x: fullTrack.mission.race.chl[i].x,
      y: fullTrack.mission.race.chl[i].y,
      z: fullTrack.mission.race.chl[i].z
    };
    const specialTypes: CpbsType[] = [];
    getCheckpointCpbs1Types(i, fullTrack).forEach(cpbs1Type => specialTypes.push(cpbs1Type));
    getCheckpointCpbs2Types(i, fullTrack).forEach(cpbs2Type => specialTypes.push(cpbs2Type));

    const size = getCheckpointSize(i, fullTrack, specialTypes);

    checkpoints.push({
      coords: coords,
      heading: fullTrack.mission.race.chh[i],
      size: size,
      specialTypes: specialTypes,
      isTransform: isTransformCheckpoint(i, fullTrack),
      isRandom: isRandomCheckpoint(i, fullTrack),
      planeRotation: getCheckpointPlaneRotation(i, fullTrack),
      secondaryCheckpoint: getSecondaryCheckpoint(i, fullTrack, size, specialTypes)
    });
  }

  // going by the R* JSON:
  // - checkpoints[0] (first item) is actually the final cp before the start/fin
  // - checkpoints[checkpoints.length - 1] (last item) is the start-fin
  // which is annoying, so we put the start/fin as [0] and move the rest by 1 index
  const checkpointsOrdered = [];
  checkpointsOrdered.push(checkpoints[checkpoints.length - 1]);

  for (let i = 0; i < checkpoints.length - 1; i++) {
    checkpointsOrdered.push(checkpoints[i]);
  }

  return checkpointsOrdered;
}

function getCheckpointSize(i: number, track: any, cpSpecialTypes: CpbsType[]) {
  // chs = checkpoint size
  if (isUndefined(track.mission.race.chs)) {
    return PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  const size = track.mission.race.chs[i];

  if (size < PARSE_DEFAULTS.CHECKPOINT.SIZE.MINIMUM) {
    return PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  const sizeTimesTen = size * PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.DEFAULT;

  if (sizeTimesTen < PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT) {
    return PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  let finalSize = sizeTimesTen;

  const isAirCp = !isUndefined(
    cpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_AIR
    )
  );

  const isRoundCp = !isUndefined(
    cpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_ROUND
    )
  );

  if (isAirCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.AIR;
  } else if (isRoundCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.ROUND;
  }

  return finalSize;
}

function getSecondaryCheckpoint(i: number, track: any, primaryCpSize: number, primaryCpSpecialTypes: CppsstType[]) {
  if (isUndefined(track.mission.race.sndchk)) {
    return undefined;
  }

  const coords = {
    // sndchk = secondary checkpoint
    x: track.mission.race.sndchk[i].x,
    y: track.mission.race.sndchk[i].y,
    z: track.mission.race.sndchk[i].z,
  };

  return {
    coords: coords,
    heading: track.mission.race.sndrsp[i],
    size: getSecondaryCheckpointSize(i, track, primaryCpSize, primaryCpSpecialTypes),
    isTransform: isTransformSecondaryCheckpoint(i, track),
    isRandom: isRandomSecondaryCheckpoint(i, track)
  };
}

function getSecondaryCheckpointSize(i: number, track: any, primaryCpSize: number, primaryCpSpecialTypes: CppsstType[]) {
  // chs2 = checkpoint size 2 = secondary checkpoint size
  if (isUndefined(track.mission.race.chs2)) {
    return PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  const size = track.mission.race.chs2[i];

  if (size < PARSE_DEFAULTS.CHECKPOINT.SIZE.MINIMUM) {
    return PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  let finalSize = size * PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.DEFAULT;

  if (finalSize < PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT) {
    finalSize = PARSE_DEFAULTS.CHECKPOINT.SIZE.DEFAULT;
  }

  if (finalSize < primaryCpSize) {
    return primaryCpSize;
  }

  const isAirCp = !isUndefined(
    primaryCpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_AIR_SECONDARY
    )
  );

  const isRoundCp = !isUndefined(
    primaryCpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_ROUND_SECONDARY
    )
  );

  if (isAirCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.AIR;
  } else if (isRoundCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.ROUND;
  }

  return finalSize;
}

function getCheckpointCpbs1Types(i: number, track: any) {
  let cpbs1Types: CpbsType[] = [];

  if (isUndefined(track.mission.race.cpbs1)) {
    return cpbs1Types;
  }

  const checkpointCpbs1Value = track.mission.race.cpbs1[i];
  if (isUndefined(checkpointCpbs1Value)) {
    return cpbs1Types;
  }

  // check bits for all cpbs1 types
  CPBS_TYPES.cpbs1.forEach((cpbs1Type) => {
    if (isBitSet(checkpointCpbs1Value, cpbs1Type.value)) {
      cpbs1Types.push(cpbs1Type);
    }
  });

  return cpbs1Types;
}

function getCheckpointCpbs2Types(i: number, track: any) {
  let cpbs2Types: CpbsType[] = [];

  if (isUndefined(track.mission.race.cpbs2)) {
    return cpbs2Types;
  }

  const checkpointCpbs2Value = track.mission.race.cpbs2[i];
  if (isUndefined(checkpointCpbs2Value)) {
    return cpbs2Types;
  }

  // check bits for all cpbs1 types
  CPBS_TYPES.cpbs2.forEach((cpbs2Type) => {
    if (isBitSet(checkpointCpbs2Value, cpbs2Type.value)) {
      cpbs2Types.push(cpbs2Type);
    }
  });

  return cpbs2Types;
}

function getCheckpointPlaneRotation(i: number, track: any): CppsstType | undefined {
  if (isUndefined(track.mission.race.cppsst)) {
    return undefined;
  }

  const cpPlaneRotationValue = track.mission.race.cppsst[i];
  if (isUndefined(cpPlaneRotationValue)) {
    return undefined;
  }

  let planeRotation = undefined;
  CPPSST_TYPES.forEach((cppsstType) => {
    if (isBitSet(cpPlaneRotationValue, cppsstType.value)) {
      planeRotation = cppsstType;
    }
  });

  return planeRotation;
}

function isTransformCheckpoint(i: number, track: any) {
  if (isUndefined(track.mission.race.cptfrm)) {
    return false;
  }
  const isTransformValue = track.mission.race.cptfrm[i];
  if (isUndefined(isTransformValue)) {
    return false;
  }
  return isTransformValue > -1.0;
}

function isRandomCheckpoint(i: number, track: any) {
  if (isUndefined(track.mission.race.cptrtt)) {
    return false;
  }
  const isRandomValue = track.mission.race.cptrtt[i];
  if (isUndefined(isRandomValue)) {
    return false;
  }
  return isRandomValue > -1.0;
}

function isTransformSecondaryCheckpoint(i: number, track: any) {
  if (isUndefined(track.mission.race.cptfrms)) {
    return false;
  }
  const isTransformValue = track.mission.race.cptfrms[i];
  if (isUndefined(isTransformValue)) {
    return false;
  }
  return isTransformValue > -1.0;
}

function isRandomSecondaryCheckpoint(i: number, track: any) {
  if (isUndefined(track.mission.race.cptrtts)) {
    return false;
  }
  const isRandomValue = track.mission.race.cptrtts[i];
  if (isUndefined(isRandomValue)) {
    return false;
  }
  return isRandomValue > -1.0;
}
