import {Fixture, PlaceableProp} from "../../../common/hotlap/type";
import {FIXTURE_REMOVAL_DEFAULTS} from "../../../client/hotlap/default";
import {PARSE_DEFAULTS} from "./default";
import {isUndefined} from "../../../common/util";

export function parseStaticProps(track: any): PlaceableProp[] {
  let props: PlaceableProp[] = [];

  if (isUndefined(track.mission.prop) || isUndefined(track.mission.prop.no)) {
    return props;
  }

  const hasPropTextureVariant = !isUndefined(track.mission.prop.prpclr);
  const hasPropLodDistances = !isUndefined(track.mission.prop.pLODDist);
  const hasPropCollisions = !isUndefined(track.mission.prop.collision);

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
  if (isUndefined(track.mission.prop.prpclr[i])) {
    return undefined;
  } else {
    return track.mission.prop.prpclr[i];
  }
}

function parseStaticPropLodDistance(i: number, track: any) {
  if (isUndefined(track.mission.prop.pLODDist[i])) {
    return undefined;
  } else {
    return track.mission.prop.pLODDist[i] !== 0;
  }
}

function parseStaticPropCollision(i: number, track: any) {
  if (isUndefined(track.mission.prop.collision)) {
    return true;
  } else {
    return track.mission.prop.collision[i] === 1;
  }
}

export function parseDynamicProps(track: any): PlaceableProp[] {
  let props: PlaceableProp[] = [];

  if (isUndefined(track.mission.dprop) || isUndefined(track.mission.dprop.no)) {
    return props;
  }

  const hasPropColors = !isUndefined(track.mission.dprop.prpclr);
  const hasPropCollisions = !isUndefined(track.mission.dprop.collision);

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
  if (isUndefined(track.mission.dprop.prpdclr[i])) {
    return undefined;
  } else {
    return track.mission.dprop.prpdclr[i];
  }
}

function parseDynamicPropCollision(i: number, track: any) {
  if (isUndefined(track.mission.dprop.collision)) {
    return true;
  } else {
    return track.mission.dprop.collision[i] === 1;
  }
}

export function parseFixtures(track: any): Fixture[] {
  let fixtures: Fixture[] = [];

  if (isUndefined(track.mission.dhprop) || isUndefined(track.mission.dhprop.no)) {
    return fixtures;
  }

  const hasFixtureRadius = !isUndefined(track.mission.dhprop.wprad);

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
  return !isUndefined(radius) ? radius : PARSE_DEFAULTS.FIXTURE.RADIUS.DEFAULT;
}
