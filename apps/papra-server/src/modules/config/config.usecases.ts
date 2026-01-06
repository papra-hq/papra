import { execSync } from 'node:child_process';
import { safelySync } from '@corentinth/chisels';

export function getCommitInfo() {
  const [gitCommitSha] = safelySync(() => execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim());
  const [gitCommitDate] = safelySync(() => execSync('git show -s --format=%cI HEAD', { encoding: 'utf-8' }).trim());

  return {
    gitCommitSha: gitCommitSha ?? undefined,
    gitCommitDate: gitCommitDate ?? undefined,
  };
}
