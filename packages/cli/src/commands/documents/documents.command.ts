import { defineCommand } from 'citty';
import { importCommand } from './import/import.command';

export const documentsCommand = defineCommand({
  meta: {
    name: 'documents',
    description: 'Manage documents',
  },
  subCommands: {
    import: importCommand,
  },
});
