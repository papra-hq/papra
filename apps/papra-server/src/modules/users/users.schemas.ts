import { createRegexSchema } from '../shared/schemas/string.schemas';
import { USER_ID_REGEX } from './users.constants';

export const userIdSchema = createRegexSchema(USER_ID_REGEX);
