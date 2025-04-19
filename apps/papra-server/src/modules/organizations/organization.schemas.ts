import { z } from 'zod';
import { ORGANIZATION_ID_REGEX } from './organizations.constants';

export const organizationIdSchema = z.string().regex(ORGANIZATION_ID_REGEX);
