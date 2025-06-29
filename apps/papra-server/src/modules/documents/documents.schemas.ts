import { z } from 'zod';
import { DOCUMENT_ID_REGEX, OCR_LANGUAGES } from './documents.constants';

export const documentIdSchema = z.string().regex(DOCUMENT_ID_REGEX);
export const ocrLanguagesSchema = z.array(z.enum(OCR_LANGUAGES));
export const stringCoercedOcrLanguagesSchema = z.string().transform(value => value.split(',').map(lang => lang.trim())).pipe(ocrLanguagesSchema);
