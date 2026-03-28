import type { ConfigDefinition } from 'figue';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';

export const organizationsConfig = {
  maxOrganizationCount: {
    doc: 'The maximum number of organizations a standard user can have',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 10,
    env: 'MAX_ORGANIZATION_COUNT_PER_USER',
  },
  invitationExpirationDelayDays: {
    doc: 'The number of days an invitation to an organization will be valid',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 7,
    env: 'ORGANIZATION_INVITATION_EXPIRATION_DELAY_DAYS',
  },
  maxUserInvitationsPerDay: {
    doc: 'The maximum number of invitations a user can send per day',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 30,
    env: 'MAX_USER_ORGANIZATIONS_INVITATIONS_PER_DAY',
  },
  deletedOrganizationsPurgeDaysDelay: {
    doc: 'The number of days before a soft-deleted organization is permanently purged',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 30,
    env: 'ORGANIZATIONS_DELETED_PURGE_DAYS_DELAY',
  },
} as const satisfies ConfigDefinition;
