import { addLogContext, createAsyncContextPlugin, wrapWithLoggerContext } from '@crowlog/async-context-plugin';
import { createLoggerFactory, type Logger } from '@crowlog/logger';

export type { Logger };
export { addLogContext, wrapWithLoggerContext };

export const createLogger = createLoggerFactory({ plugins: [createAsyncContextPlugin()] });
