import process from 'node:process';
import { getNextVersion } from '../utils';

export async function nextVersionCommand(): Promise<void> {
  const nextVersion = getNextVersion();

  console.log(nextVersion);
  process.exit(0);
}
