import type { Logger } from '@crowlog/logger';
import process from 'node:process';
import { addLogContext, createAsyncContextPlugin, wrapWithLoggerContext } from '@crowlog/async-context-plugin';
import { createGlobalLogContextPlugin, createLoggerFactory } from '@crowlog/logger';

const { addToGlobalLogContext, globalContextPlugin } = createGlobalLogContextPlugin<{
  processMode: 'web' | 'worker' | 'all';
}>();

export type { Logger };
export { addLogContext, addToGlobalLogContext, wrapWithLoggerContext };

export const createLogger = createLoggerFactory({
  plugins: [
    createAsyncContextPlugin(),
    globalContextPlugin,
    {
      name: 'discard-logs-in-test',
      shouldLog: () => process.env.NODE_ENV !== 'test',
    },
  ],
});
