import type { Database } from '../../modules/app/database/database.types';
import type { Config } from '../../modules/config/config.types';
import type { Logger } from '../../modules/shared/logger/logger';
import process from 'node:process';
import { setupDatabase } from '../../modules/app/database/database';
import { ensureLocalDatabaseDirectoryExists } from '../../modules/app/database/database.services';
import { parseConfig } from '../../modules/config/config';
import { createLogger, wrapWithLoggerContext } from '../../modules/shared/logger/logger';

export async function runScriptWithDb(
  { scriptName, silent = false }: { scriptName: string; silent?: boolean },

  fn: (args: { isDryRun: boolean; logger: Logger; db: Database; config: Config }) => Promise<void> | void,
) {
  const isDryRun = process.argv.includes('--dry-run');

  await wrapWithLoggerContext(
    {
      scriptName,
      isDryRun,
    },
    async () => {
      const logger = createLogger({ namespace: 'scripts' });

      const { config } = await parseConfig({ env: process.env });
      await ensureLocalDatabaseDirectoryExists({ config });
      const { db } = setupDatabase({ ...config.database });

      await executeScript({ logger, fn: async () => fn({ isDryRun, logger, db, config }), silent });
    },
  );
}

export async function runScript(
  { scriptName, silent = false }: { scriptName: string; silent?: boolean },
  fn: (args: { isDryRun: boolean; logger: Logger }) => Promise<void> | void,
) {
  const isDryRun = process.argv.includes('--dry-run');

  await wrapWithLoggerContext({ scriptName, isDryRun }, async () => {
    const logger = createLogger({ namespace: 'scripts' });

    await executeScript({ logger, fn: async () => fn({ isDryRun, logger }), silent });
  });
}

async function executeScript({ logger, fn, silent = false }: { logger: Logger; fn: () => Promise<unknown>; silent?: boolean }) {
  try {
    await fn();
    if (!silent) {
      logger.debug('Script finished');
    }
  } catch (error) {
    if (!silent) {
      logger.error({ error }, 'Script failed');
    }
    process.exit(1);
  }
}
