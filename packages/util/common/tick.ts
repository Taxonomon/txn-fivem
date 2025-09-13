import {wait} from "./util.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "./package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

export class Tick {
  /**
   * The FiveM-internal index under which the tick is stored.
   */
  index?: number;

  /**
   * The name of the tick.
   *
   * Gets logged whenever the tick starts or stops.
   */
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Returns {@code true} if the tick is currently running, or {@code false} if it isn't.
   */
  isRunning() {
    return undefined !== this.index;
  }

  /**
   * Starts a tick.
   *
   * @param handler A function which is executed with every tick iteration.
   * @param intervalMs The interval in milliseconds over which the tick should iterate. Defaults to zero.
   */
  start(handler: Function, intervalMs: number = 0) {
    this.index ??= setTick(async () => {
      handler();
      await wait(intervalMs);
    });
    log.trace(`Started tick '${this.name}' (running every ${intervalMs} ms)`);
  }

  /**
   * Stops a tick.
   *
   * @param handler An optional handler to run after the tick has been cleared. Can be used to tear down or clean up
   * leftover state after the tick has been stopped.
   */
  stop(handler?: Function) {
    if (this.index !== undefined) {
      clearTick(this.index);
      if (undefined !== handler) {
        handler();
      }
      this.index = undefined;
      log.trace(`Stopped tick '${this.name}'`);
    }
  }
}
