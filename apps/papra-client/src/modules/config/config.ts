export const isDev = import.meta.env.MODE === 'development';

const asBoolean = (value: string | undefined, defaultValue: boolean) => value === undefined ? defaultValue : value.trim().toLowerCase() === 'true';
const asString = <T extends string | undefined>(value: string | undefined, defaultValue?: T): T extends undefined ? string | undefined : string => (value ?? defaultValue) as T extends undefined ? string | undefined : string;
const asNumber = <T extends number | undefined>(value: string | undefined, defaultValue?: T): T extends undefined ? number | undefined : number => (value === undefined ? defaultValue : Number(value)) as T extends undefined ? number | undefined : number;

export const buildTimeConfig = {
  papraVersion: asString(import.meta.env.VITE_PAPRA_VERSION, '0.0.0'),
  baseUrl: asString(import.meta.env.VITE_BASE_URL, window.location.origin),
  baseApiUrl: asString(import.meta.env.VITE_BASE_API_URL, window.location.origin),
  vitrineBaseUrl: asString(import.meta.env.VITE_VITRINE_BASE_URL, 'http://localhost:3000/'),
  isDemoMode: asBoolean(import.meta.env.VITE_IS_DEMO_MODE, false),
  auth: {
    isRegistrationEnabled: asBoolean(import.meta.env.VITE_AUTH_IS_REGISTRATION_ENABLED, true),
    isPasswordResetEnabled: asBoolean(import.meta.env.VITE_AUTH_IS_PASSWORD_RESET_ENABLED, true),
    isEmailVerificationRequired: asBoolean(import.meta.env.VITE_AUTH_IS_EMAIL_VERIFICATION_REQUIRED, true),
    showLegalLinksOnAuthPage: asBoolean(import.meta.env.VITE_AUTH_SHOW_LEGAL_LINKS_ON_AUTH_PAGE, false),
    providers: {
      github: { isEnabled: asBoolean(import.meta.env.VITE_AUTH_PROVIDERS_GITHUB_IS_ENABLED, false) },
      google: { isEnabled: asBoolean(import.meta.env.VITE_AUTH_PROVIDERS_GOOGLE_IS_ENABLED, false) },
      customs: [] as {
        providerId: string;
        providerName: string;
        providerIconUrl: string;
      }[],
    },
  },
  documents: {
    deletedDocumentsRetentionDays: asNumber(import.meta.env.VITE_DOCUMENTS_DELETED_DOCUMENTS_RETENTION_DAYS, 30),
  },
  posthog: {
    apiKey: asString(import.meta.env.VITE_POSTHOG_API_KEY),
    host: asString(import.meta.env.VITE_POSTHOG_HOST),
    isEnabled: asBoolean(import.meta.env.VITE_POSTHOG_ENABLED, false),
  },
  intakeEmails: {
    isEnabled: asBoolean(import.meta.env.VITE_INTAKE_EMAILS_IS_ENABLED, false),
    emailGenerationDomain: asString(import.meta.env.VITE_INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN),
  },
  isSubscriptionsEnabled: asBoolean(import.meta.env.VITE_IS_SUBSCRIPTIONS_ENABLED, false),
} as const;

export type Config = typeof buildTimeConfig;
export type RuntimePublicConfig = Pick<Config, 'auth'>;
