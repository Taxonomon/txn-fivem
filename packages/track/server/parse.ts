import {Fixture, PlaceableProp, PrimaryCheckpoint, Track} from "../common/track.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {
  CPBS1_CHECKPOINT_AIR,
  CPBS1_CHECKPOINT_AIR_SECONDARY,
  CPBS1_CHECKPOINT_ROUND, CPBS1_CHECKPOINT_ROUND_SECONDARY, CPBS_TYPES,
  CpbsType
} from "../common/cpbs.ts";
import {isBitSet} from "../../util/common/util.ts";
import {FIXTURE_REMOVAL_DEFAULTS} from "../client/fixture.ts";
import {CPPSST_TYPES, CppsstType} from "../common/cppsst.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

const PARSE_DEFAULTS = {
  CHECKPOINT: {
    SIZE: {
      DEFAULT: 5.0,
      MINIMUM: 0.5,
      MULTIPLIER: {
        DEFAULT: 10.0,
        AIR: 4.5,
        ROUND: 2.25
      }
    }
  },
  FIXTURE: {
    RADIUS: {
      DEFAULT: 3.0
    }
  }
};

export function parseRockstarTrack(rockstarTrackJson: any): Track {
  if (undefined === rockstarTrackJson) {
    throw new Error('R* track JSON is undefined');
  }

  return {
    name: parseName(rockstarTrackJson),
    author: parseAuthor(rockstarTrackJson),
    description: parseDescription(rockstarTrackJson),
    checkpoints: parseCheckpoints(rockstarTrackJson),
    staticProps: parseStaticProps(rockstarTrackJson),
    dynamicProps: parseDynamicProps(rockstarTrackJson),
    fixtures: parseFixtures(rockstarTrackJson)
  };
}

function parseName(track: any) {
  return track.mission.gen.nm;
}

function parseAuthor(track: any) {
  return track.mission.gen.ownerid;
}

function parseDescription(track: any) {
  return (track.mission.gen.dec).join('');
}

function parseCheckpoints(fullTrack: any) {
  const checkpoints: PrimaryCheckpoint[] = [];

  if (undefined === fullTrack.mission.race.chp) {
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
  if (undefined === track.mission.race.chs) {
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

  const isAirCp = undefined !== (cpSpecialTypes.find((specialType) =>
    specialType === CPBS1_CHECKPOINT_AIR)
  );

  const isRoundCp = undefined !== (cpSpecialTypes.find((specialType) =>
    specialType === CPBS1_CHECKPOINT_ROUND)
  );

  if (isAirCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.AIR;
  } else if (isRoundCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.ROUND;
  }

  return finalSize;
}

function getSecondaryCheckpoint(i: number, track: any, primaryCpSize: number, primaryCpSpecialTypes: CppsstType[]) {
  if (undefined === track.mission.race.sndchk) {
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
  if (undefined === track.mission.race.chs2) {
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

  const isAirCp = undefined !== (primaryCpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_AIR_SECONDARY
  ));

  const isRoundCp = undefined !== (primaryCpSpecialTypes.find((specialType) =>
      specialType === CPBS1_CHECKPOINT_ROUND_SECONDARY
  ));

  if (isAirCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.AIR;
  } else if (isRoundCp) {
    finalSize *= PARSE_DEFAULTS.CHECKPOINT.SIZE.MULTIPLIER.ROUND;
  }

  return finalSize;
}

function getCheckpointCpbs1Types(i: number, track: any) {
  let cpbs1Types: CpbsType[] = [];

  if (undefined === track.mission.race.cpbs1) {
    return cpbs1Types;
  }

  const checkpointCpbs1Value = track.mission.race.cpbs1[i];
  if (undefined === checkpointCpbs1Value) {
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

  if (undefined === track.mission.race.cpbs2) {
    return cpbs2Types;
  }

  const checkpointCpbs2Value = track.mission.race.cpbs2[i];
  if (undefined === checkpointCpbs2Value) {
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
  if (undefined === track.mission.race.cppsst) {
    return undefined;
  }

  const cpPlaneRotationValue = track.mission.race.cppsst[i];
  if (undefined === cpPlaneRotationValue) {
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
  if (undefined === track.mission.race.cptfrm) {
    return false;
  }
  const isTransformValue = track.mission.race.cptfrm[i];
  if (undefined === isTransformValue) {
    return false;
  }
  return isTransformValue > -1.0;
}

function isRandomCheckpoint(i: number, track: any) {
  if (undefined === track.mission.race.cptrtt) {
    return false;
  }
  const isRandomValue = track.mission.race.cptrtt[i];
  if (undefined === isRandomValue) {
    return false;
  }
  return isRandomValue > -1.0;
}

function isTransformSecondaryCheckpoint(i: number, track: any) {
  if (undefined === track.mission.race.cptfrms) {
    return false;
  }
  const isTransformValue = track.mission.race.cptfrms[i];
  if (undefined === isTransformValue) {
    return false;
  }
  return isTransformValue > -1.0;
}

function isRandomSecondaryCheckpoint(i: number, track: any) {
  if (undefined === track.mission.race.cptrtts) {
    return false;
  }
  const isRandomValue = track.mission.race.cptrtts[i];
  if (undefined === isRandomValue) {
    return false;
  }
  return isRandomValue > -1.0;
}

function parseStaticProps(track: any): PlaceableProp[] {
  let props: PlaceableProp[] = [];

  if (undefined === track.mission.prop || undefined === track.mission.prop.no) {
    return props;
  }

  const hasPropTextureVariant = undefined !== track.mission.prop.prpclr;
  const hasPropLodDistances = undefined !== track.mission.prop.pLODDist;
  const hasPropCollisions = undefined !== track.mission.prop.collision;

  for (let i = 0; i < track.mission.prop.no; i++) {
    try {
      props.push({
        hash: track.mission.prop.model[i],
        isDynamic: false,
        coords: {
          x: track.mission.prop.loc[i].x,
          y: track.mission.prop.loc[i].y,
          z: track.mission.prop.loc[i].z
        },
        rotation: {
          x: track.mission.prop.vRot[i].x,
          y: track.mission.prop.vRot[i].y,
          z: track.mission.prop.vRot[i].z
        },
        isCollidable: hasPropCollisions ? parseStaticPropCollision(i, track) : false,
        textureVariant: hasPropTextureVariant ? parseStaticPropTextureVariant(i, track) : undefined,
        lodDistance: hasPropLodDistances ? parseStaticPropLodDistance(i, track) : false
      });
    } catch (error) {
      throw new Error(`failed to parse props static prop ${i}/${track.mission.prop.no} (${error})`);
    }

  }

  return props;
}

function parseStaticPropTextureVariant(i: number, track: any) {
  if (undefined === track.mission.prop.prpclr[i]) {
    return undefined;
  } else {
    return track.mission.prop.prpclr[i];
  }
}

function parseStaticPropLodDistance(i: number, track: any) {
  if (undefined === track.mission.prop.pLODDist[i]) {
    return undefined;
  } else {
    return track.mission.prop.pLODDist[i] !== 0;
  }
}

function parseStaticPropCollision(i: number, track: any) {
  if (undefined === track.mission.prop.collision) {
    return true;
  } else {
    return track.mission.prop.collision[i] === 1;
  }
}

function parseDynamicProps(track: any): PlaceableProp[] {
  let props: PlaceableProp[] = [];

  if (undefined === track.mission.dprop || undefined === track.mission.dprop.no) {
    return props;
  }

  const hasPropColors = undefined !== track.mission.dprop.prpclr;
  const hasPropCollisions = undefined !== track.mission.dprop.collision;

  for (let i = 0; i < track.mission.dprop.no; i++) {
    try {
      props.push({
        hash: track.mission.dprop.model[i],
        isDynamic: true,
        coords: {
          x: track.mission.dprop.loc[i].x,
          y: track.mission.dprop.loc[i].y,
          z: track.mission.dprop.loc[i].z
        },
        rotation: {
          x: track.mission.dprop.vRot[i].x,
          y: track.mission.dprop.vRot[i].y,
          z: track.mission.dprop.vRot[i].z
        },
        isCollidable: hasPropCollisions ? parseDynamicPropCollision(i, track) : false,
        textureVariant: hasPropColors ? parseDynamicPropTextureVariant(i, track) : undefined
      });
    } catch (error) {
      throw new Error(`failed to parse dynamic prop ${i}/${track.mission.prop.no} (${error})`);
    }
  }

  return props;
}

function parseDynamicPropTextureVariant(i: number, track: any) {
  if (undefined === track.mission.dprop.prpdclr[i]) {
    return undefined;
  } else {
    return track.mission.dprop.prpdclr[i];
  }
}

function parseDynamicPropCollision(i: number, track: any) {
  if (undefined === track.mission.dprop.collision) {
    return true;
  } else {
    return track.mission.dprop.collision[i] === 1;
  }
}

function parseFixtures(track: any): Fixture[] {
  let fixtures: Fixture[] = [];

  if (undefined === track.mission.dhprop || undefined === track.mission.dhprop.no) {
    return fixtures;
  }

  const hasFixtureRadius = undefined !== track.mission.dhprop.wprad;

  for (let i = 0; i < track.mission.dhprop.no; i++) {
    try {
      fixtures.push({
        hash: track.mission.dhprop.mn[i],
        coords: {
          x: track.mission.dhprop.pos[i].x,
          y: track.mission.dhprop.pos[i].y,
          z: track.mission.dhprop.pos[i].z
        },
        radius: hasFixtureRadius ? parseFixtureRadius(i, track) : FIXTURE_REMOVAL_DEFAULTS.REMOVAL.RADIUS
      });
    } catch (error) {
      throw new Error(`failed to parse fixture ${i}/${track.mission.dhprop.no} (${error})`);
    }
  }

  return fixtures;
}

function parseFixtureRadius(i: number, track: any) {
  const radius = track.mission.dhprop.wprad[i];
  return undefined !== radius ? radius : PARSE_DEFAULTS.FIXTURE.RADIUS.DEFAULT;
}
