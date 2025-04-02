import type { Database } from '../../modules/app/database/database.types';
import type { Config } from '../../modules/config/config.types';
import type { Logger } from '../../modules/shared/logger/logger';
import process from 'node:process';
import { setupDatabase } from '../../modules/app/database/database';
import { parseConfig } from '../../modules/config/config';
import { createLogger, wrapWithLoggerContext } from '../../modules/shared/logger/logger';

export { runScript };

async function runScript(
  { scriptName }: { scriptName: string },
  fn: (args: { isDryRun: boolean; logger: Logger; db: Database; config: Config }) => Promise<void> | void,
) {
  const isDryRun = process.argv.includes('--dry-run');

  wrapWithLoggerContext(
    {
      scriptName,
      isDryRun,
    },
    async () => {
      const logger = createLogger({ namespace: 'scripts' });

      const { config } = await parseConfig({ env: process.env });
      const { db, client } = setupDatabase({ ...config.database });

      try {
        logger.info('Script started');
        await fn({ isDryRun, logger, db, config });
        logger.info('Script finished');
      } catch (error) {
        logger.error({ error }, 'Script failed');
        process.exit(1);
      } finally {
        client.close();
      }
    },
  );
}
