import type { createLogger } from './logger';
import type { logLevels } from './logger.constants';

export type Logger = ReturnType<typeof createLogger>;

export type LogLevel = typeof logLevels[number];
export type LoggerTransportLogArgs = {
  level: LogLevel;
  message: string;
  timestampMs: number;
  namespace: string;
  data: Record<string, unknown>;
};

export type LoggerTransport = {
  log: (args: LoggerTransportLogArgs) => void;
};

export type LogMethodArguments = [data: Record<string, unknown>, message: string] | [message: string];
