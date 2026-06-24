import type { ExecOptions } from 'node:child_process';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function executeCommand(command: string, options?: ExecOptions) {
  const { stdout, stderr } = await execAsync(command, {
    ...options,
    encoding: 'utf-8',
  });

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

export async function executeCommandSafely(command: string, options?: ExecOptions) {
  try {
    return await executeCommand(command, options);
  } catch (error) {
    if (
      error instanceof Error &&
      'stdout' in error &&
      'stderr' in error &&
      typeof error.stdout === 'string' &&
      typeof error.stderr === 'string'
    ) {
      return {
        stdout: error.stdout.trim(),
        stderr: error.stderr.trim(),
      };
    }

    return {
      stdout: '',
      stderr: '',
    };
  }
}
