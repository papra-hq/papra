import type { createAuthClient } from './auth.services';

export function createDemoAuthClient() {
  const baseClient = {
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
    signUp: () => Promise.resolve({}),
    forgetPassword: () => Promise.resolve({}),
    resetPassword: () => Promise.resolve({}),
    sendVerificationEmail: () => Promise.resolve({}),
  };

  return new Proxy(baseClient, {
    get: (target, prop) => {
      if (!(prop in target)) {
        console.warn(`Accessing undefined property "${String(prop)}" in demo auth client`);
      }
      return target[prop as keyof typeof target];
    },
  }) as unknown as ReturnType<typeof createAuthClient>;
}
