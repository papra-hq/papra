import { createRegexSchema } from '../shared/schemas/string.schemas';
import { ORGANIZATION_ID_REGEX, ORGANIZATION_INVITATION_ID_REGEX, ORGANIZATION_MEMBER_ID_REGEX } from './organizations.constants';

export const organizationIdSchema = createRegexSchema(ORGANIZATION_ID_REGEX);
export const memberIdSchema = createRegexSchema(ORGANIZATION_MEMBER_ID_REGEX);
export const invitationIdSchema = createRegexSchema(ORGANIZATION_INVITATION_ID_REGEX);
