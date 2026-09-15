// Keep pending shares on hold during setup and while editing app preferences.
// Opening app settings must not bypass server selection or authentication.
const holdPathPrefixes = ['/auth', '/config', '/organizations/create', '/app-settings'];

export function shouldRedirectShareIntent({
  hasShareIntent,
  pathname,
}: {
  hasShareIntent: boolean;
  pathname: string;
}) {
  return (
    hasShareIntent &&
    pathname !== '/share' &&
    !holdPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}
