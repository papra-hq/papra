import { z } from 'zod';
import { USER_ID_REGEX } from './users.constants';

export const userIdSchema = z.string().regex(USER_ID_REGEX);
