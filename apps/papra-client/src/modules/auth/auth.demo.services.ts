import type { createAuthClient } from 'better-auth/solid';

export function createDemoAuthClient() {
  return {
    useSession: () => () => ({
      isPending: false,
      data: {
        user: {
          id: '1',
          email: 'test@test.com',
        },
      },
    }),
    signIn: {
      email: () => Promise.resolve({}),
      social: () => Promise.resolve({}),
    },
    signOut: () => Promise.resolve({}),
  } as unknown as ReturnType<typeof createAuthClient>;
}
