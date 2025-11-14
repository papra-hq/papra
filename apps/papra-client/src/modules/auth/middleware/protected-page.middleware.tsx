import type { Component } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { Match, Suspense, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useSession } from '../auth.services';

export function createProtectedPage({ authType, component }: { authType: 'public' | 'private' | 'public-only' | 'admin'; component: Component }) {
  return () => {
    const session = useSession();

    const getIsAuthenticated = () => Boolean(session()?.data?.user);

    return (
      <Suspense>
        <Switch fallback={<Dynamic component={component} />}>
          <Match when={authType === 'private' && !getIsAuthenticated()}>
            <Navigate href="/login" />
          </Match>
          <Match when={authType === 'public-only' && getIsAuthenticated()}>
            <Navigate href="/" />
          </Match>
        </Switch>
      </Suspense>
    );
  };
}
