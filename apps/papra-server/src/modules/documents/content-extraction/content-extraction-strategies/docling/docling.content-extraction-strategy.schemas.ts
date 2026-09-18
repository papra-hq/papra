import * as v from 'valibot';

export const doclingOptionsSchema = v.pipe(
  v.string(),
  v.transform((value) => (value === '' ? '{}' : value)),
  v.parseJson(),
  v.check(
    (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    'DOCLING_OPTIONS must be a JSON object.',
  ),
  v.record(
    v.pipe(
      v.string(),
      v.check(
        (key) => !['files', 'to_formats', 'image_export_mode', 'target'].includes(key),
        'DOCLING_OPTIONS cannot set files, to_formats, image_export_mode, or target; these fields are managed by Papra.',
      ),
    ),
    v.unknown(),
  ),
);
