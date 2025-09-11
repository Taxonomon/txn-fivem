import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {Vector3} from "../../util/common/vector.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export const CHECKPOINT_DEFAULTS = {
  BLIP: {
    SCALE: {
      CURRENT: 1.3,
      NEXT: 0.65
    },
    ALPHA: {
      CURRENT: 255.0,
      NEXT: 130.0
    },
    // blip sprite ids: https://docs.fivem.net/docs/game-references/blips/
    // TODO consider moving BlipDefaults.sprite values to RockstarConstants.ts
    SPRITE: {
      CHECKPOINT: 1,
      PIT: 1, // TODO fix me!
      FINISH: 1 // TODO fix me!
    },
    // blip color ids: https://docs.fivem.net/docs/game-references/blips/#blip-colors
    COLOR: {
      CHECKPOINT: 5,
      PIT: 1, // TODO fix me!
      FINISH: 5 // TODO fix me!
    },
    LABEL: {
      CHECKPOINT: {
        CURRENT: 'Current Checkpoint',
        NEXT: 'Next Checkpoint'
      },
      FINISH: 'Finish Line',
      PIT: {
        ENTRY: 'Pit Lane Entry',
        EXIT: 'Pit Lane Exit'
      }
    },
    // display = 6 = shows on both main map and minimap (selectable on map)
    // see: https://docs.fivem.net/natives/?_0x9029B2F3DA924928
    DISPLAY: {
      MAIN_MAP_AND_MINIMAP_SELECTABLE_ON_MAP: 6
    }
  },
  HOLO: {
    CHECKPOINT: {
      DISPLAY_TYPE: 1,
      COLOR: {
        R: 182.0,
        G: 245.0,
        B: 125.0,
        A: 50.0
      },
    },
    PIT: {
      DISPLAY_TYPE: 5,
      COLOR: {
        R: 182.0,
        G: 245.0,
        B: 125.0,
        A: 50.0
      }
    },
    FINISH: {
      DISPLAY_TIME: 9,
      COLOR: {
        R: 182.0,
        G: 245.0,
        B: 125.0,
        A: 50.0
      }
    },
    INVISIBLE_TRIGGER_EXTEND: 1.5,
    OFFSET: {
      Z: 2.5 // so the cp is put slightly into the ground (looks better & still works the same)
    },
    RESERVED: 0 // only needed for special cp types which aren't used in this script
  }
};

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
    z - CHECKPOINT_DEFAULTS.HOLO.OFFSET.Z,
    // next cp's coords are where the checkpoint model's arrow is pointed towards
    nextCpCoords.x,
    nextCpCoords.y,
    nextCpCoords.z,
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
