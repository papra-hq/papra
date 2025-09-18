import type { ConfigDefinition } from 'figue';

import { z } from 'zod';
import { PATTERNS_PLACEHOLDERS } from './pattern.intake-email-username-driver.constants';

export const PATTERN_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME = 'pattern';

export const patternIntakeEmailDriverConfig = {
  pattern: {
    doc: `The pattern to use when generating email addresses usernames (before the @) for intake emails. Available placeholders are: ${Object.values(PATTERNS_PLACEHOLDERS).join(', ')}. Note: the resulting username will be slugified to remove special characters and spaces.`,
    schema: z.string(),
    default: `${PATTERNS_PLACEHOLDERS.USER_NAME}-${PATTERNS_PLACEHOLDERS.RANDOM_DIGITS}`,
    env: 'INTAKE_EMAILS_USERNAME_DRIVER_PATTERN',
  },
} as const satisfies ConfigDefinition;
