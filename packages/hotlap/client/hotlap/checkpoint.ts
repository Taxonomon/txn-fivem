import {Vector3} from "../../common/hotlap/type.ts";
import {CHECKPOINT_DEFAULTS} from "./default";
import {ConsoleLogger} from "../../../logging/common/log.ts";
import {PACKAGE_NAME} from "../../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export async function drawCheckpointBlip(coords: Vector3, isCurrentCp: boolean) {
  const { x, y, z } = coords;
  const blipRef = AddBlipForCoord(x, y, z);

  // TODO differentiate between checkpoint, finish line and pit blips (maybe even with individual functions)
  SetBlipSprite(blipRef, CHECKPOINT_DEFAULTS.BLIP.SPRITE.CHECKPOINT);
  SetBlipColour(blipRef, CHECKPOINT_DEFAULTS.BLIP.COLOR.CHECKPOINT);
  SetBlipDisplay(blipRef, CHECKPOINT_DEFAULTS.BLIP.DISPLAY.MAIN_MAP_AND_MINIMAP_SELECTABLE_ON_MAP);

  // set checkpoint blip name on main map (as far as I understood)
  BeginTextCommandSetBlipName('STRING');
  AddTextComponentString(isCurrentCp
    ? CHECKPOINT_DEFAULTS.BLIP.LABEL.CHECKPOINT.CURRENT
    : CHECKPOINT_DEFAULTS.BLIP.LABEL.CHECKPOINT.NEXT
  );
  EndTextCommandSetBlipName(blipRef);

  SetBlipScale(
    blipRef,
    isCurrentCp
      ? CHECKPOINT_DEFAULTS.BLIP.SCALE.CURRENT
      : CHECKPOINT_DEFAULTS.BLIP.SCALE.NEXT
  );

  SetBlipAlpha(
    blipRef,
    isCurrentCp
      ? CHECKPOINT_DEFAULTS.BLIP.ALPHA.CURRENT
      : CHECKPOINT_DEFAULTS.BLIP.ALPHA.NEXT
  );

  log.debug(`Drew ${isCurrentCp ? 'current' : 'next' } checkpoint blip at x=${x}, y=${y}, z=${z}`);
  return blipRef;
}

export async function removeCheckpointBlip(blipRef: number) {
  RemoveBlip(blipRef);
}

export async function drawCheckpointHolo(
  cpCoords: Vector3,
  cpSize: number,
  nextCpCoords: Vector3,
  isSecondaryHolo: boolean
) {
  const { x, y, z } = cpCoords;
  if (isSecondaryHolo && (x === 0 && y === 0 && z === 0)) {
    log.debug(`Checkpoint at x=${cpCoords.x}, y=${cpCoords.y}, z=${cpCoords.z} has no secondary holo to draw`);
    return;
  }

  return CreateCheckpoint(
    CHECKPOINT_DEFAULTS.HOLO.CHECKPOINT.DISPLAY_TYPE,
    x,
    y,
    z,
    // next cp's coords are where the checkpoint model's arrow is pointed towards
    nextCpCoords.x,
    nextCpCoords.y,
    nextCpCoords.z - CHECKPOINT_DEFAULTS.HOLO.OFFSET.Z,
    cpSize * CHECKPOINT_DEFAULTS.HOLO.INVISIBLE_TRIGGER_EXTEND,
    CHECKPOINT_DEFAULTS.HOLO.CHECKPOINT.COLOR.R,
    CHECKPOINT_DEFAULTS.HOLO.CHECKPOINT.COLOR.G,
    CHECKPOINT_DEFAULTS.HOLO.CHECKPOINT.COLOR.B,
    CHECKPOINT_DEFAULTS.HOLO.CHECKPOINT.COLOR.A,
    CHECKPOINT_DEFAULTS.HOLO.RESERVED
  );
}

export async function removeCheckpointHolo(holoRef: number) {
  DeleteCheckpoint(holoRef);
}
