import type { ParentComponent } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { Match, Switch } from 'solid-js';
import { useAuthRedirect } from '../composables/use-auth-redirect.composable';
import { useSession } from '../composables/use-session.composable';

export const PublicOnlyPage: ParentComponent = (props) => {
  const { getIsAuthenticated, sessionQuery } = useSession();
  const { getPostAuthRedirect } = useAuthRedirect();

  return (
    <Switch>
      <Match when={!sessionQuery.isLoading && getIsAuthenticated()}>
        <Navigate href={getPostAuthRedirect()} />
      </Match>
      <Match when={!sessionQuery.isLoading && !getIsAuthenticated()}>{props.children}</Match>
    </Switch>
  );
};
