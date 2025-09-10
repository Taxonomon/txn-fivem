export const CHAT_COLORS = {
  // All other colors not listed are different between client and server, or just white.
  RED: '^1',
  GREEN: '^2',
  YELLOW: '^3',
  DARK_BLUE: '^4',
  LIGHT_BLUE: '^5',
  VIOLET: '^6',
  WHITE: '^0'
};

export type LogLevel = {
  name: string,
  color: string
};

/**
 * Defines the default set of available log levels:
 * <ul>
 *   <li>FATAL</li>
 *   <li>ERROR</li>
 *   <li>WARN</li>
 *   <li>INFO</li>
 *   <li>DEBUG</li>
 *   <li>TRACE</li>
 * </li>
 */
export class LogLevels {
  static readonly FATAL: LogLevel = {
    name: 'FATAL',
    color: CHAT_COLORS.VIOLET
  };

  static readonly ERROR: LogLevel = {
    name: 'ERROR',
    color: CHAT_COLORS.RED
  };

  static readonly WARN: LogLevel = {
    name: 'WARN',
    color: CHAT_COLORS.YELLOW
  };

  static readonly INFO: LogLevel = {
    name: 'INFO',
    color: CHAT_COLORS.WHITE
  };

  static readonly DEBUG: LogLevel = {
    name: 'DEBUG',
    color: CHAT_COLORS.LIGHT_BLUE
  };

  static readonly TRACE: LogLevel = {
    name: 'TRACE',
    color: CHAT_COLORS.DARK_BLUE
  };
}

/**
 * A basic console logger.
 *
 * If called from the client, the log message will be printed to the in-game console (F8), and won't be visible in
 * the FXServer console.
 *
 * If called from the server, the log message will be printed to the FXServer console, and won't be visible in the
 * client's in-game console (F8).
 */
export class ConsoleLogger {
  resourcePackage?: string;

  constructor(resourcePackage?: string) {
    this.resourcePackage = resourcePackage;
  }

  fatal(message: string) {
    this.logMessage(LogLevels.FATAL, message);
  }

  error(message: string) {
    this.logMessage(LogLevels.ERROR, message);
  }

  warn(message: string) {
    this.logMessage(LogLevels.WARN, message);
  }

  info(message: string) {
    this.logMessage(LogLevels.INFO, message);
  }

  debug(message: string): void {
    this.logMessage(LogLevels.DEBUG, message);
  }

  trace(message: string): void {
    this.logMessage(LogLevels.TRACE, message);
  }

  logMessage(level: LogLevel, message: string): void {
    const now = new Date().toISOString();
    const color = level.color;

    if (undefined === this.resourcePackage) {
      console.log(`${color}[${now}] [${level.name}] ${message}`);
    } else {
      console.log(`${color}[${'pkg:' + this.resourcePackage}] [${now}] [${level.name}] ${message}`);
    }
  }
}
