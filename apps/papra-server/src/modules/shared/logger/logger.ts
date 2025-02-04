import type { LoggerTransport, LogLevel, LogMethodArguments } from './logger.types';
import { AsyncLocalStorage } from 'node:async_hooks';
import { logLevels } from './logger.constants';
import { createConsoleLoggerTransport } from './transports/console.logger-transport';

const asyncLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

export function addLogContext(context: Record<string, unknown>) {
  const currentContext = asyncLocalStorage.getStore();

  if (!currentContext) {
    console.warn('Trying to add log context outside of logger middleware');
    return;
  }

  Object.assign(currentContext, context);
}

export function wrapWithLoggerContext<T>(data: Record<string, unknown>, cb: () => T) {
  return asyncLocalStorage.run({ ...data }, cb);
}

export function createLogger({
  namespace,
  transports = [createConsoleLoggerTransport()],
}: {
  namespace: string;
  transports?: LoggerTransport[];
}) {
  const buildLogger = ({ level }: { level: LogLevel }) => {
    return (...args: [data: Record<string, unknown>, message: string] | [message: string]) => {
      const [data, message] = args.length === 1 ? [{}, args[0]] : args;

      const loggerContext = asyncLocalStorage.getStore();
      const timestampMs = Date.now();

      transports.forEach((transport) => {
        transport.log({
          level,
          message,
          timestampMs,
          namespace,
          data: {
            ...loggerContext,
            ...data,
          },
        });
      });
    };
  };

  return logLevels.reduce((acc, level) => ({
    ...acc,
    [level]: buildLogger({ level }),
  }), {} as Record<LogLevel, (...args: LogMethodArguments) => void>);
}
