import process from 'node:process';
import { cancel, isCancel } from '@clack/prompts';
import { getErrorMessage } from '../errors/errors.models';

export async function exitOnCancel<T>(promise: Promise<T | symbol>): Promise<T> {
  const value = await promise;

  if (isCancel(value)) {
    exit('Operation cancelled');
  }

  if (typeof value === 'symbol') {
    // should never happen, but for type safety
    throw new TypeError('Unexpected symbol value');
  }
  return value;
}

export function exit(message: string): never {
  // There is a small indentation for the first line, so we adjust all lines to have the same style
  cancel(message.split('\n').join('\n   '));
  process.exit(1);
}

export async function exitOnError<T>(
  promise: Promise<T>,
  {
    errorContext,
  }: {
    /**
     * Additional context to display with the error message.
     */
    errorContext?: string;
  } = { },
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    exit([errorContext, getErrorMessage(error)].filter(Boolean).join('\n'));
  }
}
