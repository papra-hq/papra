import { defineCommand } from 'citty';
import { paperlessCommand } from './paperless/paperless.command';

export const importCommand = defineCommand({
  meta: {
    name: 'import',
    description: 'Import documents from external sources',
  },
  subCommands: {
    paperless: paperlessCommand,
  },
});
