import { executeCommandSafely } from '../shared/exec/exec.services';
import { isNilOrEmptyString } from '../shared/utils';

export async function getCommitInfo() {
  const [
    { stdout: gitCommitShaStdout },
    { stdout: gitCommitDateStdout },
  ] = await Promise.all([
    executeCommandSafely('git rev-parse HEAD'),
    executeCommandSafely('git show -s --format=%cI HEAD'),
  ]);

  return {
    gitCommitSha: isNilOrEmptyString(gitCommitShaStdout) ? undefined : gitCommitShaStdout,
    gitCommitDate: isNilOrEmptyString(gitCommitDateStdout) ? undefined : gitCommitDateStdout,
  };
}
