import type { CookieOptions } from 'hono/utils/cookie';
import type { Context } from '../server.types';
import { injectArguments } from '@corentinth/chisels';
import { deleteCookie as deleteCookieImpl, getSignedCookie as getSignedCookieImpl, setSignedCookie as setSignedCookieImpl } from 'hono/cookie';

export type CookieRepository = ReturnType<typeof createCookieRepository>;

export function createCookieRepository({ context }: { context: Context }) {
  return injectArguments(
    {
      setSignedCookie,
      getSignedCookie,
      deleteCookie,
    },
    { context },
  );
}

async function setSignedCookie({ context, cookieName, value, secret, options }: { context: Context; cookieName: string; value: string; secret: string; options: CookieOptions }) {
  await setSignedCookieImpl(context, cookieName, value, secret, options);
}

async function getSignedCookie({ context, cookieName, secret }: { context: Context; cookieName: string; secret: string }) {
  return getSignedCookieImpl(context, secret, cookieName);
}

async function deleteCookie({ context, cookieName, options }: { context: Context; cookieName: string; options?: CookieOptions }) {
  return deleteCookieImpl(context, cookieName, options);
}
