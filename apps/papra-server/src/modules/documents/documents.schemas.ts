import * as v from 'valibot';
import { z } from 'zod';
import { DOCUMENT_ID_REGEX, OCR_LANGUAGES } from './documents.constants';

export const documentIdSchema = z.string().regex(DOCUMENT_ID_REGEX);

export const ocrLanguagesSchema = v.array(v.picklist(OCR_LANGUAGES));
export const stringCoercedOcrLanguagesSchema = v.pipe(
  v.string(),
  v.transform(value => value.split(',').map(lang => lang.trim())),
  ocrLanguagesSchema,
);
