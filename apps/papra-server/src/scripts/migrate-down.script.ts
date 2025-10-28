import { rollbackLastAppliedMigration } from '../migrations/migrations.usecases';
import { runScriptWithDb } from './commons/run-script';

await runScriptWithDb(
  { scriptName: 'migrate-down' },
  async ({ db }) => {
    await rollbackLastAppliedMigration({ db });
  },
);
