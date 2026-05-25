import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { API_KEY_ID_REGEX, API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';

export const apiKeyIdSchema = createRegexSchema(API_KEY_ID_REGEX);

export const apiKeyPermissionsSchema = v.pipe(
  v.array(v.picklist(API_KEY_PERMISSIONS_VALUES)),
  v.minLength(1),
);
