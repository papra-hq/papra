import type { ConfigDefinition } from 'figue';
import { booleanishSchema } from '../../../config/config.schemas';
import { documentKeyEncryptionKeysSchema } from './document-encryption.schemas';

export const documentEncryptionConfig = {
  isEncryptionEnabled: {
    doc: 'Whether to enable encryption for documents',
    schema: booleanishSchema,
    default: false,
    env: 'DOCUMENT_STORAGE_ENCRYPTION_IS_ENABLED',
  },
  documentKeyEncryptionKeys: {
    doc: `
Key encryption keys (KEKs) used to encrypt the document encryption key (DEK), as 32-byte hex strings, you can generate one using the command \`openssl rand -hex 32\`.

Formats:
- Single key: \`0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c\` (will be assigned version \`1\`)
- Multiple keys: \`1:<key1>,2:<key2>\`
   - The key with the highest version will be used to encrypt new DEKs, others will be used to decrypt existing DEKs
   - Versions must be unique and can be any alphabetically sortable string
   - The order of the version:key pair is not important
`.trim(),
    schema: documentKeyEncryptionKeysSchema,
    default: undefined,
    env: 'DOCUMENT_STORAGE_DOCUMENT_KEY_ENCRYPTION_KEYS',
  },

} as const satisfies ConfigDefinition;
