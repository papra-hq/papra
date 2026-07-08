import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { folderIdRegex, MAX_FOLDER_NAME_LENGTH } from './folders.constants';

export const folderIdSchema = createRegexSchema(folderIdRegex);

export const folderNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(MAX_FOLDER_NAME_LENGTH),
);

export const createFolderBodySchema = v.strictObject({
  name: folderNameSchema,
  parentId: v.optional(v.nullable(folderIdSchema)),
});

export const updateFolderBodySchema = v.pipe(
  v.strictObject({
    name: v.optional(folderNameSchema),
    parentId: v.optional(v.nullable(folderIdSchema)),
  }),
  v.check(
    (data) => data.name !== undefined || data.parentId !== undefined,
    "At least one of 'name' or 'parentId' must be provided",
  ),
);
