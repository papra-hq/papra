import { defineCommand, runMain } from 'citty';
import { description, version } from '../package.json';
import { configCommand } from './commands/config/config.command';
import { documentsCommand } from './commands/documents/documents.command';
import { cliName } from './config';

const main = defineCommand({
  meta: {
    name: cliName,
    version,
    description,
  },
  subCommands: {
    documents: documentsCommand,
    config: configCommand,
  },
});

runMain(main);
