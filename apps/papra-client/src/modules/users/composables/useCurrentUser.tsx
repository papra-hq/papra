import type { ParentComponent } from 'solid-js';
import type { UserMe } from '../users.types';
import { makePersisted } from '@solid-primitives/storage';
import { useQuery } from '@tanstack/solid-query';
import { createContext, createSignal, Show, useContext } from 'solid-js';
import { fetchCurrentUser } from '../users.services';

const currentUserContext = createContext<{
  user: UserMe;
  refreshCurrentUser: () => Promise<void>;

  getLatestOrganizationId: () => string | null;
  setLatestOrganizationId: (organizationId: string) => void;
  hasPermission: (permission: string) => boolean;
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

  const query = useQuery(() => ({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
  }));

  return (
    <Show when={query.data}>
      <currentUserContext.Provider
        value={{
          user: query.data!.user,
          refreshCurrentUser: async () => {
            query.refetch();
          },

          getLatestOrganizationId,
          setLatestOrganizationId,
          hasPermission: (permission: string) => query.data?.user.permissions?.includes(permission) ?? false,
        }}
      >
        {props.children}
      </currentUserContext.Provider>
    </Show>
  );
};
