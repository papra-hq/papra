import type { LoggerTransport, LoggerTransportLogArgs } from '../logger.types';

type LogWithoutTimestamp = Omit<LoggerTransportLogArgs, 'timestampMs'>;

type InMemoryLoggerTransport = LoggerTransport & {
  getLogs: ((options: { excludeTimestampMs: true }) => LogWithoutTimestamp[])
    & ((options?: { excludeTimestampMs?: false }) => LoggerTransportLogArgs[]);
};

export function createInMemoryLoggerTransport(): InMemoryLoggerTransport {
  const logs: LoggerTransportLogArgs[] = [];

  return {
    log: (args) => {
      logs.push(args);
    },
    getLogs: (options) => {
      if (options?.excludeTimestampMs === true) {
        return logs.map(({ timestampMs: _, ...log }) => log) as ReturnType<InMemoryLoggerTransport['getLogs']>;
      }

      return logs;
    },
  };
}
