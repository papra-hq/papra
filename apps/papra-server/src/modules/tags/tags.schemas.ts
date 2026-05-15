import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { TagColorRegex, tagIdRegex } from './tags.constants';

export const tagIdSchema = createRegexSchema(tagIdRegex);

export const tagNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
);

export const tagColorSchema = v.pipe(
  v.string(),
  v.toUpperCase(),
  v.regex(TagColorRegex, 'Invalid Color format, must be a hex color code like #000000'),
);

export const tagDescriptionSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(256),
);
