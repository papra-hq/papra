import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { DOCUMENT_VIEW_ID_REGEX } from './document-views.constants';

export const documentViewIdSchema = createRegexSchema(DOCUMENT_VIEW_ID_REGEX);
export const documentViewNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(255),
);
export const documentViewDescriptionSchema = v.pipe(v.string(), v.trim(), v.maxLength(256));
