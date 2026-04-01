import type { AppConfigDefinition } from '../config/config.types';
import { booleanishSchema } from '../config/config.schemas';
import { allowedWebhookUrlHostnamesSchema } from './webhooks.config.schemas';
import { WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR } from './webhooks.constants';

export const webhookConfig = {
  isSsrfProtectionEnabled: {
    doc: `If false, the SSRF protection for webhook URLs will be fully disabled. This is not recommended and should only be used if you understand the risks and consequences of disabling this protection. Preferably, you should use the webhookUrlAllowedHostnames (${WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR}) setting to specify allowed hostnames instead of disabling SSRF protection entirely.`,
    env: 'WEBHOOK_SSRF_PROTECTION_ENABLED',
    schema: booleanishSchema,
    default: true,
  },
  webhookUrlAllowedHostnames: {
    doc: 'A list of allowed hostnames for webhook URLs that would be considered safe from SSRF attacks. If not set, all local, private and reserved IP addresses will be blocked.',
    env: WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR,
    schema: allowedWebhookUrlHostnamesSchema,
    default: [],
  },
} as const satisfies AppConfigDefinition;
