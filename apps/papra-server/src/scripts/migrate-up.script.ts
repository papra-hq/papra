import { runMigrations } from '../migrations/migrations.usecases';
import { runScriptWithDb } from './commons/run-script';

await runScriptWithDb(
  { scriptName: 'migrate-up' },
  async ({ db }) => {
    await runMigrations({ db });
  },
);
