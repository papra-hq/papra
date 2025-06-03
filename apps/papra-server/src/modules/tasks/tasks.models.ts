import type { Database } from '../app/database/database.types';
import type { Config } from '../config/config.types';
import type { Logger } from '../shared/logger/logger';
import { isFunction } from 'lodash-es';
import { createLogger } from '../shared/logger/logger';

export { defineTask };

export type TaskDefinition = ReturnType<typeof defineTask>;

function defineTask({
  name: taskName,
  cronSchedule,
  isEnabled,
  runOnStartup = false,
  handler,
  logger: taskLogger = createLogger({ namespace: `tasks:${taskName}` }),
}: {
  name: string;
  isEnabled: boolean | ((args: { config: Config }) => boolean);
  cronSchedule: string | ((args: { config: Config }) => string);
  runOnStartup?: boolean | ((args: { config: Config }) => boolean);
  handler: (handlerArgs: { db: Database; config: Config; logger: Logger; now: Date }) => Promise<void>;
  logger?: Logger;
}) {
  const run = async ({
    getNow = () => new Date(),
    logger = taskLogger,
    ...handlerArgs
  }: {
    db: Database;
    config: Config;
    getNow?: () => Date;
    logger?: Logger;
  }) => {
    const startedAt = getNow();

    try {
      logger.debug({ taskName, startedAt }, 'Task started');

      await handler({ ...handlerArgs, logger, now: getNow() });

      const durationMs = getNow().getTime() - startedAt.getTime();
      logger.info({ taskName, durationMs, startedAt }, 'Task completed');
    } catch (error) {
      logger.error({ error, taskName, startedAt }, 'Task failed');
    }
  };

  return {
    taskName,
    run,
    getIsEnabled: (args: { config: Config }) => (isFunction(isEnabled) ? isEnabled(args) : isEnabled),
    getCronSchedule: (args: { config: Config }) => (isFunction(cronSchedule) ? cronSchedule(args) : cronSchedule),
    getRunOnStartup: (args: { config: Config }) => (isFunction(runOnStartup) ? runOnStartup(args) : runOnStartup),
  };
}
