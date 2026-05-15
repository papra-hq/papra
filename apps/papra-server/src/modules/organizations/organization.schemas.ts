import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { ORGANIZATION_ID_REGEX, ORGANIZATION_INVITATION_ID_REGEX, ORGANIZATION_MEMBER_ID_REGEX, ORGANIZATION_ROLES } from './organizations.constants';

export const organizationIdSchema = createRegexSchema(ORGANIZATION_ID_REGEX);
export const memberIdSchema = createRegexSchema(ORGANIZATION_MEMBER_ID_REGEX);
export const invitationIdSchema = createRegexSchema(ORGANIZATION_INVITATION_ID_REGEX);

export const organizationNameSchema = v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(50));
export const assignableOrganizationRoleSchema = v.picklist([ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.MEMBER]);
