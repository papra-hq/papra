import { buildPathWithRedirect, parseRedirectPath } from '@/modules/navigation/redirect';
import { asSingleParam } from '@/modules/shared/utils/query-params';
import { useSearchParams } from '@solidjs/router';
import { authPagesPaths } from '../auth.constants';

export function useAuthRedirect() {
  const [searchParams] = useSearchParams();

  const getRedirectPath = () => parseRedirectPath(asSingleParam(searchParams.redirect));
  const getPostAuthRedirect = () => getRedirectPath() ?? '/';

  const getPathWithRedirect = (path: string) =>
    buildPathWithRedirect({ path, redirectPath: getRedirectPath() });

  return {
    getRedirectPath,
    getPostAuthRedirect,

    getPathWithRedirect,
    getLoginPathWithRedirect: () => getPathWithRedirect(authPagesPaths.login),
    getRegisterPathWithRedirect: () => getPathWithRedirect(authPagesPaths.register),
  };
}
