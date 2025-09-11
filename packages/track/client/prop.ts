import {PlaceableProp} from "../common/track.ts";
import {waitForModelToLoad} from "../../util/client/util.ts";

export const PROP_PLACEMENT_DEFAULTS = {
  ROTATION_ORDER: {
    Z_Y_X: 2.0
  },
  LOD_DISTANCE: 16960.0, // no idea why specifically this value
  DETECTION: {
    RADIUS: 500.0,
    INTERVAL_MS: 100
  }
};

export async function placeProp(prop: PlaceableProp) {
  if (!isValidCdImageModel(prop.hash)) {
    throw new Error(`Prop (hash=${prop.hash}) is not a valid CD image model`);
  }

  await waitForModelToLoad(prop.hash);

  const placedPropIndex: number = CreateObjectNoOffset(
    prop.hash,
    prop.coords.x,
    prop.coords.y,
    prop.coords.z,
    false,
    true,
    false
  );

  SetEntityRotation(
    placedPropIndex,
    prop.rotation.x,
    prop.rotation.y,
    prop.rotation.z,
    PROP_PLACEMENT_DEFAULTS.ROTATION_ORDER.Z_Y_X,
    false
  );

  if (undefined !== prop.textureVariant) {
    SetObjectTextureVariant(placedPropIndex, prop.textureVariant);
  }

  // TODO the normally set LOD distance is usually way too low - check how to handle this
  SetEntityLodDist(placedPropIndex, PROP_PLACEMENT_DEFAULTS.LOD_DISTANCE);
  SetEntityCollision(placedPropIndex, !prop.isCollidable, !prop.isCollidable);
  FreezeEntityPosition(placedPropIndex, true); // to freeze dynamic props

  return placedPropIndex;
}

export async function removeProp(propRef: number) {
  DeleteObject(propRef);
}

function isValidCdImageModel(hash: number) {
  return IsModelInCdimage(hash) && IsModelValid(hash);
}
