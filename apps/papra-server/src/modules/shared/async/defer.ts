import type { Logger } from '../logger/logger';
import { safely } from '@corentinth/chisels';
import { createLogger } from '../logger/logger';

export function safelyDefer(fn: () => Promise<void>, { logger = createLogger({ namespace: 'defer' }) }: { logger?: Logger } = {}) {
  setImmediate(async () => {
    const [, error] = await safely(fn);

    if (error) {
      logger.error({ error }, 'Error in safelyDefer');
    }
  });
}

export function createDeferable<Args extends unknown[]>(fn: (...args: Args) => Promise<void>) {
  return (...args: Args) => safelyDefer(() => fn(...args));
}
