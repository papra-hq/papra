import * as p from '@clack/prompts';
import { FetchError } from 'ofetch';

export function reportClientError(error: Error) {
  const code = getCauseCode(error);

  if (error instanceof FetchError && error.data?.error?.message) {
    p.log.error(`Error: ${error.data.error.message}`);
    return;
  }

  if (typeof code === 'string' && ['ERR_NETWORK', 'ECONNREFUSED'].includes(code)) {
    p.log.error(`Failed to connect to the server: ${code}\n${error.message}`);
    return;
  }

  p.log.error(`${error.message}`);
}

function getCauseCode(error: Error & { code?: unknown }): unknown | null {
  if (error.code) {
    return error.code;
  }

  if (error.cause instanceof Error) {
    return getCauseCode(error.cause);
  }

  return null;
}
