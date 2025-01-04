export const config = {
  baseApiUrl: (import.meta.env.VITE_BASE_API_URL ?? 'http://localhost:1221/') as string,
  vitrineBaseUrl: (import.meta.env.VITE_VITRINE_BASE_URL ?? 'http://localhost:3000/') as string,
  isRegistrationEnabled: import.meta.env.VITE_IS_REGISTRATION_ENABLED === 'true',
} as const;

export type Config = typeof config;
