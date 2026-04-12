import { z } from 'zod';
import { ORGANIZATION_ID_REGEX, ORGANIZATION_INVITATION_ID_REGEX, ORGANIZATION_MEMBER_ID_REGEX } from './organizations.constants';

export const organizationIdSchema = z.string().regex(ORGANIZATION_ID_REGEX);
export const memberIdSchema = z.string().regex(ORGANIZATION_MEMBER_ID_REGEX);
export const invitationIdSchema = z.string().regex(ORGANIZATION_INVITATION_ID_REGEX);
