import type { ChangelogEntry } from '../types';
import path from 'node:path';
import process from 'node:process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generateFilename, PENDING_DIR, writeEntry } from '../utils';

export async function addCommand(): Promise<void> {
  p.intro(pc.bold('Changelog Entry'));

  const entry = await p.group(
    {
      type: () => p.select<ChangelogEntry['type']>({
        message: 'What type of change is this?',
        options: [
          { value: 'feature', label: 'Feature - New functionality' },
          { value: 'improvement', label: 'Improvement - Enhancement to existing feature' },
          { value: 'fix', label: 'Fix - Bug fix' },
          { value: 'technical', label: 'Technical - Non-user facing change' },
        ],
      }),
      content: () => p.text({
        message: 'Enter a detailed description (markdown supported):',
        placeholder: 'Papra now uses calver for versioning',
      }),
      isBreaking: () => p.confirm({
        message: 'Is this a breaking change?',
        initialValue: false,
      }),
    },
    {
      onCancel: () => {
        p.cancel('Changelog entry creation aborted.');
        process.exit(0);
      },
    },
  );

  // Generate filename and write
  const filename = generateFilename();
  const filePath = path.join(PENDING_DIR, filename);

  writeEntry({ filePath, entry });

  p.outro(pc.green(`Changelog entry created: ${pc.dim(filename)}`));
}
