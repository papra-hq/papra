import type { ExecException, ExecOptions } from 'node:child_process';
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
    const execError = error as ExecException;

    return {
      stdout: execError.stdout?.trim() ?? '',
      stderr: execError.stderr?.trim() ?? '',
    };
  }
}
