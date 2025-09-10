import {LOG_EVENTS} from "../common/event";
import {ConsoleLogger} from "../common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);
const prefix = `Message from server:`;

// handle log messages from server

onNet(LOG_EVENTS.FATAL.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.fatal(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.ERROR.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.error(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.WARN.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.warn(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.INFO.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.info(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.DEBUG.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.debug(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

onNet(LOG_EVENTS.TRACE.FROM.SERVER, (message: string) => {
  if (undefined !== message) {
    log.trace(`${prefix} ${message}`);
  } else {
    log.warn(`Failed to log info from client: message is undefined`);
  }
});

// send log messages to server

// send log messages to client

export function logFatalToServer(message: string) {
  emitNet(LOG_EVENTS.FATAL.FROM.CLIENT, message);
}

export function logErrorToServer(message: string) {
  emitNet(LOG_EVENTS.ERROR.FROM.CLIENT, message);
}

export function logWarningToServer(message: string) {
  emitNet(LOG_EVENTS.WARN.FROM.CLIENT, message);
}

export function logInfoToServer(message: string) {
  emitNet(LOG_EVENTS.INFO.FROM.CLIENT, message);
}

export function logDebugToServer(message: string) {
  emitNet(LOG_EVENTS.DEBUG.FROM.CLIENT, message);
}

export function logTraceToServer(message: string) {
  emitNet(LOG_EVENTS.TRACE.FROM.CLIENT, message);
}
