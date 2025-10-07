import process from 'node:process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getPendingEntries, movePendingEntriesToVersion, setCurrentVersion } from '../utils';

export async function releaseCommand({ version }: { version?: string }): Promise<void> {
  if (!version) {
    p.outro(pc.red('Version is required. Use --version or -v to specify the next version.'));
    process.exit(1);
  }

  // ensure version match YY.MM.N
  if (!/^\d{2}\.\d{1,2}\.\d+$/.test(version)) {
    p.outro(pc.red('Invalid version format. Use YY.MM.N format, e.g., 24.6.0'));
    process.exit(1);
  }

  const pending = getPendingEntries();

  if (pending.length === 0) {
    p.outro(pc.yellow('No pending changelog entries found'));
    process.exit(0);
  }

  const date = new Date().toISOString().split('T')[0]!;

  p.intro(pc.bold('Release Changelog'));
  console.log(pc.dim(`Found ${pending.length} pending changelog ${pending.length === 1 ? 'entry' : 'entries'}`));
  console.log(pc.dim(`Next version: ${pc.bold(version)}`));
  console.log();

  const spinner = p.spinner();
  spinner.start('Moving entries to releases folder');

  movePendingEntriesToVersion(version, date);
  setCurrentVersion(version);

  spinner.stop(pc.green(`Moved ${pending.length} ${pending.length === 1 ? 'entry' : 'entries'} to .changelog/releases/${version}/`));

  p.outro(pc.green(`Released version: ${pc.bold(version)}`));
}
