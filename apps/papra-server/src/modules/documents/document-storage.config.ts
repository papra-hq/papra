import { coercedPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { IN_BYTES } from '../shared/units';

export const documentMaxUploadSizeConfig = {
  doc: 'The maximum size in bytes for an uploaded file. Set to 0 to disable the limit and allow uploading documents of any size.',
  schema: coercedPositiveIntegerSchema,
  default: 25 * IN_BYTES.MEGABYTE,
  env: 'DOCUMENT_STORAGE_MAX_UPLOAD_SIZE',
} as const;
