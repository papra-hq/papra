import type { Context } from '../../app/server.types';
import { isNil } from '../utils';

export function getHeader({ context, name }: { context: Context; name: string }) {
  return context.req.header(name);
}

export function getAuthorizationHeader({ context }: { context: Context }) {
  const authorizationHeader = getHeader({ context, name: 'Authorization' });

  return { authorizationHeader };
}

export function getImpersonatedUserIdFromHeader({ context }: { context: Context }) {
  const impersonatedUserId = getHeader({ context, name: 'x-user-id' });

  return { impersonatedUserId };
}

export function getContentLengthHeader({ headers }: { headers: Record<string, string> }): number | undefined {
  const contentLengthHeaderValue = headers['content-length'] ?? headers['Content-Length'];

  if (isNil(contentLengthHeaderValue)) {
    return undefined;
  }

  return Number(contentLengthHeaderValue);
}
