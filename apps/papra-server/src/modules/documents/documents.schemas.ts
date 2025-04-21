import { z } from 'zod';
import { DOCUMENT_ID_REGEX } from './documents.constants';

export const documentIdSchema = z.string().regex(DOCUMENT_ID_REGEX);
