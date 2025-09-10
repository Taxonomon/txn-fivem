import {Fixture, PlaceableProp} from "../../common/hotlap/type.ts";
import {isUndefined} from "../../common/util.ts";
import {PROP_PLACEMENT_DEFAULTS} from "../../client/hotlap/default.ts";
import {waitForModelToLoad} from "../../client/util.ts";
import {ConsoleLogger} from "../../../logging/common/log.ts";
import {PACKAGE_NAME} from "../../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export async function placeStaticProp(staticProp: PlaceableProp) {
  if (!isValidCdImageModel(staticProp.hash)) {
    throw new Error(
      `Static prop ${staticProp.hash} ('${GetEntityArchetypeName(staticProp.hash)}' is not a valid CD image model`
    );
  } else {
    return placeProp(staticProp);
  }
}

export async function placeDynamicProp(dynamicProp: PlaceableProp) {
  if (!isValidCdImageModel(dynamicProp.hash)) {
    throw new Error(
      `Static prop ${dynamicProp.hash} ('${GetEntityArchetypeName(dynamicProp.hash)}' is not a valid CD image model`
    );
  } else {
    return placeProp(dynamicProp);
  }
}

async function placeProp(prop: PlaceableProp) {
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

  if (!isUndefined(prop.textureVariant)) {
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

export async function hideFixture(fixture: Fixture) {
  try {
    CreateModelHideExcludingScriptObjects(
      fixture.coords.x,
      fixture.coords.y,
      fixture.coords.z,
      fixture.radius,
      fixture.hash,
      true
    );
    return true;
  } catch (error) {
    log.error(`Failed to hide fixture (hash=${fixture.hash}): ${error}`);
    return false;
  }
}

export async function unhideFixture(fixture: Fixture) {
  RemoveModelHide(
    fixture.coords.x,
    fixture.coords.y,
    fixture.coords.z,
    fixture.radius,
    fixture.hash,
    false
  );
}
