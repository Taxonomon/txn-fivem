export const PROP_PLACEMENT_DEFAULTS = {
  ROTATION_ORDER: {
    Z_Y_X: 2.0
  },
  LOD_DISTANCE: 16960.0,
  DETECTION: {
    RADIUS: 150.0,
    INTERVAL_MS: 100
  }
};

export const FIXTURE_REMOVAL_DEFAULTS = {
  GAME_POOL: {
    OBJECTS: 'CObject'
  },
  REMOVAL: {
    // this is the default removal radius to use when a prop has none defined
    // max should be 500.0
    RADIUS: 3.0,
    // hashes to force being removed
    FORCE: [
      -1063472968, // prop_streetlight_01
      1821241621,  // prop_streetlight_01b
      -1222468156, // prop_streetlight_02
      729253480,   // prop_streetlight_03
      1327054116,  // prop_streetlight_03b
      1021745343,  // prop_streetlight_03c
      -1114695146, // prop_streetlight_03d
      -1454378608, // prop_streetlight_03e
    ],
  },
  DETECTION: {
    // check if fixtures can be removed within this radius to the player
    // 1000.0 is just straight up not working with poles and lamps
    RADIUS: 150.0,
    INTERVAL_MS: 500
  },
}

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
      Z: 10.0 // so the cp is put slightly into the ground (looks better & still works the same)
    },
    RESERVED: 0 // only needed for special cp types which aren't used in this script
  }
};
