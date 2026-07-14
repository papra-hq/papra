import { safelySync } from '@corentinth/chisels';
import { PUBLIC_ONLY_PAGES_PATHS } from './navigation.constants';

const DUMMY_ORIGIN = 'https://sandbox.internal';

const ALLOWED_PATHNAME_CHARACTERS_REGEX = /^[a-zA-Z0-9\-_/]*$/;

export function parseRedirectPath(rawPath: string | undefined): string | undefined {
  const path = rawPath?.trim();

  if (!path) {
    return undefined;
  }

  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return undefined;
  }

  const [url, urlParsingError] = safelySync(() => new URL(path, DUMMY_ORIGIN));

  if (urlParsingError) {
    return undefined;
  }

  // Ensure nothing shady is going on with the URL
  if (url.origin !== DUMMY_ORIGIN || url.username !== '' || url.password !== '') {
    return undefined;
  }

  const { pathname, search, hash } = url;

  if (pathname === '/' || pathname.includes('//')) {
    return undefined;
  }

  if (!ALLOWED_PATHNAME_CHARACTERS_REGEX.test(pathname)) {
    return undefined;
  }

  // Ensure the redirection is not targeting a public-only page (like login or register)
  const isPublicAuthPage = PUBLIC_ONLY_PAGES_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );

  if (isPublicAuthPage) {
    return undefined;
  }

  return `${pathname}${search}${hash}`;
}

export function buildPathWithRedirect({
  path,
  redirectPath: rawRedirectPath,
}: {
  path: string;
  redirectPath?: string;
}): string {
  const redirectPath = parseRedirectPath(rawRedirectPath);

  if (!redirectPath) {
    return path;
  }

  // In order to preserve queries and hashes
  const url = new URL(path, DUMMY_ORIGIN);
  url.searchParams.set('redirect', redirectPath);

  return url.pathname + url.search + url.hash;
}
