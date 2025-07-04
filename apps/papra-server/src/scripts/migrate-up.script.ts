import { runMigrations } from '../modules/app/database/database.services';
import { runScript } from './commons/run-script';

await runScript(
  { scriptName: 'migrate-up' },
  async ({ db }) => {
    // Drizzle kit config don't support encryption yet so we cannot use npx drizzle-kit migrate
    // to run migrations. We have to run them manually.
    await runMigrations({ db });
  },
);
