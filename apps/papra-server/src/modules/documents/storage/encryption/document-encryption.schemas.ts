import { Buffer } from 'node:buffer';
import { z } from 'zod';

export const documentKeyEncryptionKeySchema = z.object({
  version: z.string(),
  key: z.instanceof(Buffer).refine(x => x.length === 32, { message: 'The key must be a 32 bytes long hex string' }),
});

const documentKeyEncryptionKeyArraySchema = z
  .array(documentKeyEncryptionKeySchema)
  .refine(x => x.length === new Set(x.map(x => x.version)).size, { message: 'The keys must have unique versions' });

export const documentKeyEncryptionKeysSchema = z.union([
  documentKeyEncryptionKeyArraySchema,
  z.string().transform((x) => {
    if (x.match(/^[0-9a-f]{64}$/i)) {
      return [{
        version: '1',
        key: Buffer.from(x, 'hex'),
      }];
    }

    const keys = x.split(',').map(x => x.trim().split(':')).map(([version, key]) => {
      if (version === undefined || key === undefined) {
        return undefined;
      }

      return {
        version,
        key: Buffer.from(key, 'hex'),
      };
    });

    if (keys.length === 0) {
      return undefined;
    }

    return keys;
  }).pipe(documentKeyEncryptionKeyArraySchema),
]).optional();
