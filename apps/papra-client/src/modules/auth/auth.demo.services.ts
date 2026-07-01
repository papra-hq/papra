import type { createAuthClient } from './auth.services';

export function createDemoAuthClient() {
  const baseClient = {
    getSession: () => ({
      data: {
        user: {
          id: '1',
          email: 'test@test.com',
        },
      },
    }),
    signIn: {
      email: async () => Promise.resolve({}),
      social: async () => Promise.resolve({}),
    },
    signOut: async () => Promise.resolve({}),
    signUp: async () => Promise.resolve({}),
    requestPasswordReset: async () => Promise.resolve({}),
    resetPassword: async () => Promise.resolve({}),
    sendVerificationEmail: async () => Promise.resolve({}),
    twoFactor: {
      enable: async () => Promise.resolve({ data: null, error: null }),
      disable: async () => Promise.resolve({ data: null, error: null }),
      getTotpUri: async () => Promise.resolve({ data: null, error: null }),
      verifyTotp: async () => Promise.resolve({ data: null, error: null }),
      generateBackupCodes: async () => Promise.resolve({ data: null, error: null }),
      viewBackupCodes: async () => Promise.resolve({ data: null, error: null }),
      verifyBackupCode: async () => Promise.resolve({ data: null, error: null }),
    },
  };

  return new Proxy(baseClient, {
    get: (target, prop) => {
      if (!(prop in target)) {
        // oxlint-disable-next-line no-console
        console.warn(`Accessing undefined property "${String(prop)}" in demo auth client`);
      }
      return target[prop as keyof typeof target];
    },
  }) as unknown as ReturnType<typeof createAuthClient>;
}
