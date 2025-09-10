import {LOG_EVENTS} from "../common/event";
import {ConsoleLogger} from "../common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

const prefix = (playerId: number): string =>
  `Message from client (id=${playerId}, name="${GetPlayerName(playerId)}"):`;

// handle log messages from client

onNet(LOG_EVENTS.FATAL.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.fatal(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.ERROR.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.error(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.WARN.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.warn(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.INFO.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.info(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.DEBUG.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.debug(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.TRACE.FROM.CLIENT, (message: string) => {
  if (undefined !== message) {
    log.trace(`${prefix(source)} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

// send log messages to client

export function logFatalToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.FATAL.FROM.SERVER, client, message);
}

export function logErrorToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.ERROR.FROM.SERVER, client, message);
}

export function logWarningToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.WARN.FROM.SERVER, message);
}

export function logInfoToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.INFO.FROM.SERVER, message);
}

export function logDebugToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.DEBUG.FROM.SERVER, message);
}

export function logTraceToClient(message: string, client: number = -1) {
  emitNet(LOG_EVENTS.TRACE.FROM.SERVER, message);
}
