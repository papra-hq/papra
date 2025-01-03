import type { ParentComponent } from 'solid-js';
import type { UserMe } from '../users.types';
import { makePersisted } from '@solid-primitives/storage';
import { createQueries } from '@tanstack/solid-query';
import { createContext, createSignal, Show, useContext } from 'solid-js';
import { fetchCurrentUser } from '../users.services';

const currentUserContext = createContext<{
  user: UserMe;
  refreshCurrentUser: () => Promise<void>;

  getLatestOrganizationId: () => string | null;
  setLatestOrganizationId: (organizationId: string) => void;
}>();

export function useCurrentUser() {
  const context = useContext(currentUserContext);

  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }

  return context;
}

export const CurrentUserProvider: ParentComponent = (props) => {
  const [getLatestOrganizationId, setLatestOrganizationId] = makePersisted(createSignal<string | null>(null), { name: 'papra_current_organization_id', storage: localStorage });

  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ['users', 'me'],
        queryFn: fetchCurrentUser,
      },

    ],
  }));

  return (
    <Show when={queries[0].data}>
      <currentUserContext.Provider
        value={{
          user: queries[0].data!.user,
          refreshCurrentUser: async () => {
            queries[0].refetch();
          },

          getLatestOrganizationId,
          setLatestOrganizationId,
        }}
      >
        {props.children}
      </currentUserContext.Provider>
    </Show>
  );
};
