// cppsst

export type CppsstType = {
  name: string;
  value: number;
}

/**
 * A list of unique checkpoint plane rotation types (I assume).
 *
 * Taken from: <a href="https://github.com/taoletsgo/custom_races/blob/f96528d4665d83281ecfd8c93c857d19ffeefefb/main script/custom_races/server/races_room.lua">github.com/taoletsgo/custom_races</a>
 *
 * Credit to the original authors.
 */
export const CPPSST_TYPES = [
  {
    name: 'UP',
    value: 0
  },
  {
    name: 'RIGHT',
    value: 1
  },
  {
    name: 'DOWN',
    value: 2
  },
  {
    name: 'LEFT',
    value: 3
  }
];
