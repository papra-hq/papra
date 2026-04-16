import { createRegexSchema } from '../shared/schemas/string.schemas';
import { tagIdRegex } from './tags.constants';

export const tagIdSchema = createRegexSchema(tagIdRegex);
