const resourceName = GetCurrentResourceName();

export const LOG_EVENTS = {
  FATAL: {
    FROM: {
      SERVER: `${resourceName}:log:fatal:from:server`,
      CLIENT: `${resourceName}:log:fatal:from:client`
    }
  },
  ERROR: {
    FROM: {
      SERVER: `${resourceName}:log:error:from:server`,
      CLIENT: `${resourceName}:log:error:from:client`
    }
  },
  WARN: {
    FROM: {
      SERVER: `${resourceName}:log:warn:from:server`,
      CLIENT: `${resourceName}:log:warn:from:client`
    }
  },
  INFO: {
    FROM: {
      SERVER: `${resourceName}:log:info:from:server`,
      CLIENT: `${resourceName}:log:info:from:client`
    }
  },
  DEBUG: {
    FROM: {
      SERVER: `${resourceName}:log:debug:from:server`,
      CLIENT: `${resourceName}:log:debug:from:client`
    }
  },
  TRACE: {
    FROM: {
      SERVER: `${resourceName}:log:trace:from:server`,
      CLIENT: `${resourceName}:log:trace:from:client`
    }
  },
}
