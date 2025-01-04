import type { Logger } from './logger.types';

export function createTestLogger() {
  const loggerArgs: Record<string, unknown[]> = {};

  const logFn = (level: string) => (...args: unknown[]) => {
    if (!loggerArgs[level]) {
      loggerArgs[level] = [];
    }

    loggerArgs[level].push(args);
  };

  const logger = {
    info: logFn('info'),
    warn: logFn('warn'),
    error: logFn('error'),
    debug: logFn('debug'),
    trace: logFn('trace'),
    fatal: logFn('fatal'),
    silent: logFn('silent'),
  } as Logger;

  return {
    logger,
    getLoggerArgs: () => loggerArgs,
  };
}
