import type { LoggerTransport, LogLevel } from '../logger.types';

export function createConsoleLoggerTransport(): LoggerTransport {
  return {
    log({ level, data, ...extra }) {
      const consoleMethodMap: Record<LogLevel, 'log' | 'warn' | 'error'> = {
        debug: 'log',
        info: 'log',
        warn: 'warn',
        error: 'error',
      };

      const consoleMethod = consoleMethodMap[level];

      // eslint-disable-next-line no-console
      console[consoleMethod]({ ...data, ...extra, level });
    },
  };
}
