import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const schemaUsernameIntakeEmailDriverConfig = {
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails when using the schema username driver',
    schema: z.string(),
    default: 'papra.email',
    env: 'INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN',
  },
  uniqueIdentifierSchema: {
    doc: 'The schema for the username generator, placeholders like {{username}}, {{random-digits}} (3 digits), {{organization-id}} and {{organization-name}}',
    schema: z.string(),
    default: '{{username}}-{{organization-name}}-{{random-digits}}',
    env: 'INTAKE_EMAILS_USERNAME_GENERATION_SCHEMA',
  },
} as const satisfies ConfigDefinition;
