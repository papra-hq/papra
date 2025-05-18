import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const organizationsConfig = {
  maxOrganizationCount: {
    doc: 'The maximum number of organizations a standard user can have',
    schema: z.coerce.number().int().positive(),
    default: 10,
    env: 'MAX_ORGANIZATION_COUNT_PER_USER',
  },
  invitationExpirationDelayDays: {
    doc: 'The number of days an invitation to an organization will be valid',
    schema: z.coerce.number().int().positive(),
    default: 7,
    env: 'ORGANIZATION_INVITATION_EXPIRATION_DELAY_DAYS',
  },
  maxUserInvitationsPerDay: {
    doc: 'The maximum number of invitations a user can send per day',
    schema: z.coerce.number().int().positive(),
    default: 30,
    env: 'MAX_USER_ORGANIZATIONS_INVITATIONS_PER_DAY',
  },
} as const satisfies ConfigDefinition;
