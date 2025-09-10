export const EVENTS = {
  HOTLAP: {
    TRACK: {
      REQUESTED: 'hotlap:track:requested',
      PROVIDED: {
        METADATA: 'hotlap:track:provided:metadata',
        PROPS: {
          STATIC: 'hotlap:track:provided:props:static',
          DYNAMIC: 'hotlap:track:provided:props:dynamic'
        },
        FIXTURES: 'hotlap:track:provided:fixtures',
        CHECKPOINTS: 'hotlap:track:provided:checkpoints',
        SPAWN: 'hotlap:track:provided:spawn'
      }
    },
    ACTIVE: {
      NEXT_CHECKPOINT: {
        REQUESTED: 'hotlap:active:next-checkpoint:requested',
        RECEIVED: 'hotlap:active:next-checkpoint:received'
      }
    },
    QUIT: 'hotlap:quit',
    SERVER_LOG: {
      ERROR: 'hotlap:server:log:error',
      WARNING: 'hotlap:server:log:warning',
      INFO: 'hotlap:server:log:info'
    }
  }
};
