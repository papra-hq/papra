import type { FetchError } from 'ofetch';

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  if (error.name === 'FetchError') {
    const fetchError = error as FetchError;

    if (fetchError.response) {
      return `API request failed with status ${fetchError.status} ${fetchError.statusText}`;
    }

    return `Network error, server unreachable.\n${fetchError.message}`;
  }

  return error.message;
}
