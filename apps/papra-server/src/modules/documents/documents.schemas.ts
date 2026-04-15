import { createRegexSchema } from '../shared/schemas/string.schemas';
import { DOCUMENT_ID_REGEX } from './documents.constants';

export const documentIdSchema = createRegexSchema(DOCUMENT_ID_REGEX);
