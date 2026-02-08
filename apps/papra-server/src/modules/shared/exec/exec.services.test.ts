import { describe, expect, test } from 'vitest';
import { executeCommand, executeCommandSafely } from './exec.services';

describe('exec services', () => {
  describe('executeCommand', () => {
    test('execute a shell command and return stdout and stderr', async () => {
      expect(
        await executeCommand('echo "Hello, World!" && echo "This is an error message." 1>&2'),
      ).to.eql({
        stdout: 'Hello, World!',
        stderr: 'This is an error message.',
      });
    });

    test('an error is thrown if the command fails', async () => {
      await expect(executeCommand('exit 1')).rejects.toThrow();
    });

    test('stdout and stderr are trimmed', async () => {
      expect(
        await executeCommand('echo "   Hello, World!   " && echo "   This is an error message.   " 1>&2'),
      ).to.eql({
        stdout: 'Hello, World!',
        stderr: 'This is an error message.',
      });
    });
  });

  describe('executeCommandSafely', () => {
    test('returns stdout and stderr even if the command fails', async () => {
      expect(
        await executeCommandSafely('echo "Hello, World!" && echo "This is an error message." 1>&2 && exit 1'),
      ).to.eql({
        stdout: 'Hello, World!',
        stderr: 'This is an error message.',
      });

      expect(
        await executeCommandSafely('exit 1'),
      ).to.eql({
        stdout: '',
        stderr: '',
      });

      expect(await executeCommandSafely('echo "Only stdout"'),
      ).to.eql({
        stdout: 'Only stdout',
        stderr: '',
      });

      expect(
        await executeCommandSafely('echo "Only stderr" 1>&2 && exit 1'),
      ).to.eql({
        stdout: '',
        stderr: 'Only stderr',
      });
    });
  });
});
