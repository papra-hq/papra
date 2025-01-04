import { AsyncLocalStorage } from 'node:async_hooks';

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

function createScopedLogger({ level, consoleMethod, extra = {} }: { level: string; consoleMethod: 'log' | 'warn' | 'error'; extra?: Record<string, unknown> }) {
  return (...args: [data: Record<string, unknown>, message: string] | [message: string]) => {
    const [data, message] = args.length === 1 ? [{}, args[0]] : args;

    const loggerContext = asyncLocalStorage.getStore();

    // eslint-disable-next-line no-console
    console[consoleMethod]({
      ...loggerContext,
      ...data,
      ...extra,
      level,
      message,
      timestampMs: Date.now(),
    });
  };
}

export function createLogger(extra: { namespace: string } & Record<string, unknown>) {
  return {
    info: createScopedLogger({ level: 'info', consoleMethod: 'log', extra }),
    warn: createScopedLogger({ level: 'warn', consoleMethod: 'warn', extra }),
    error: createScopedLogger({ level: 'error', consoleMethod: 'error', extra }),
  };
}
