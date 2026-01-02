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
    requestPasswordReset: () => Promise.resolve({}),
    resetPassword: () => Promise.resolve({}),
    sendVerificationEmail: () => Promise.resolve({}),
    twoFactor: {
      enable: () => Promise.resolve({ data: null, error: null }),
      disable: () => Promise.resolve({ data: null, error: null }),
      getTotpUri: () => Promise.resolve({ data: null, error: null }),
      verifyTotp: () => Promise.resolve({ data: null, error: null }),
      generateBackupCodes: () => Promise.resolve({ data: null, error: null }),
      viewBackupCodes: () => Promise.resolve({ data: null, error: null }),
      verifyBackupCode: () => Promise.resolve({ data: null, error: null }),
    },
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
