import type { ParentComponent } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { Match, Switch } from 'solid-js';
import { useSession } from '../composables/use-session.composable';

export const PublicOnlyPage: ParentComponent = (props) => {
  const { getIsAuthenticated, sessionQuery } = useSession();

  return (
    <Switch>
      <Match when={!sessionQuery.isLoading && getIsAuthenticated()}>
        <Navigate href="/" />
      </Match>
      <Match when={!sessionQuery.isLoading && !getIsAuthenticated()}>
        {props.children}
      </Match>
    </Switch>
  );
};
