import {Vector3} from "../common/vector.ts";
import {Tick} from "../common/tick.ts";

class CommonClientTicks {
  playerCoords = new Tick('player coordinates');
}

class CommonClientState {
  playerCoords?: Vector3
  ticks = new CommonClientTicks;
}

export const commonClientState = new CommonClientState();
