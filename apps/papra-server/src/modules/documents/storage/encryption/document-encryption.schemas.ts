import { Buffer } from 'node:buffer';
import * as v from 'valibot';
import { areDocumentKeyEncryptionKeysUnique } from './document-encryption.schemas.models';

const documentKeyEncryptionKeySchema = v.object({
  version: v.string(),
  key: v.pipe(
    v.instance(Buffer),
    v.length(32),
  ),
});

const documentKeyEncryptionKeyListSchema = v.pipe(
  v.array(documentKeyEncryptionKeySchema),
  v.check(
    keys => areDocumentKeyEncryptionKeysUnique(keys),
    'The keys must have unique versions',
  ),
);

const versionedHexKeySchema = v.pipe(
  v.string(),
  v.transform((x): { version?: string; key?: string } => {
    if (!x.includes(':')) {
      return { version: '1', key: x };
    }
    const [version, key] = x.split(':');
    return { version, key };
  }),
  v.object({
    version: v.string(),
    key: v.pipe(
      v.string(),
      v.regex(/^[0-9a-f]{64}$/i, 'The key must be a 64 hex characters string (32 bytes)'),
    ),
  }),
  v.transform(({ version, key }) => ({
    version,
    key: Buffer.from(key, 'hex'),
  })),
);

export const coercedDocumentKeyEncryptionKeysListSchema = v.optional(v.union(
  [
    documentKeyEncryptionKeyListSchema,
    v.pipe(
      v.string(),
      v.transform(value => value.split(',').map(part => part.trim())),
      v.array(versionedHexKeySchema),
      v.check(
        keys => areDocumentKeyEncryptionKeysUnique(keys),
        'The keys must have unique versions',
      ),
    ),
  ],
  'The value must be either a 32 bytes long hex string, or a comma separated list of version:key pairs where the key is a 32 bytes long hex string',
));
