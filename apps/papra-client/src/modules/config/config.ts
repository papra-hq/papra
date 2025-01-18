export const buildTimeConfig = {
  papraVersion: import.meta.env.VITE_PAPRA_VERSION,
  baseUrl: (import.meta.env.VITE_BASE_URL ?? window.location.origin) as string,
  baseApiUrl: (import.meta.env.VITE_BASE_API_URL ?? window.location.origin) as string,
  vitrineBaseUrl: (import.meta.env.VITE_VITRINE_BASE_URL ?? 'http://localhost:3000/') as string,
  isDemoMode: import.meta.env.VITE_IS_DEMO_MODE === 'true',
  auth: {
    isRegistrationEnabled: import.meta.env.VITE_AUTH_IS_REGISTRATION_ENABLED !== 'false',
    isPasswordResetEnabled: import.meta.env.VITE_AUTH_IS_PASSWORD_RESET_ENABLED !== 'false',
    isEmailVerificationRequired: import.meta.env.VITE_AUTH_IS_EMAIL_VERIFICATION_REQUIRED !== 'false',
    providers: {
      github: {
        isEnabled: import.meta.env.VITE_AUTH_PROVIDERS_GITHUB_IS_ENABLED === 'true',
      },
      google: {
        isEnabled: import.meta.env.VITE_AUTH_PROVIDERS_GOOGLE_IS_ENABLED === 'true',
      },
    },
  },
  documents: {
    deletedDocumentsRetentionDays: Number(import.meta.env.VITE_DOCUMENTS_DELETED_DOCUMENTS_RETENTION_DAYS ?? 30),
  },
  plausible: {
    isEnabled: import.meta.env.VITE_PLAUSIBLE_IS_ENABLED === 'true',
    domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
    apiHost: import.meta.env.VITE_PLAUSIBLE_API_HOST,
  },
} as const;

export type Config = typeof buildTimeConfig;
export type RuntimePublicConfig = Pick<Config, 'auth'>;
