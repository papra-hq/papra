import type { BinaryLike, DecipherGCM } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Transform } from 'node:stream';
import { castError } from '@corentinth/chisels';
import { isNil } from '../utils';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function encrypt({ key, value }: { key: BinaryLike; value: BinaryLike }) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = cipher.update(value);
  cipher.final();
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

export function decrypt({ encryptedValue, key }: { encryptedValue: Buffer; key: BinaryLike }) {
  const iv = encryptedValue.subarray(0, IV_LENGTH);
  const tag = encryptedValue.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encryptedBuffer = encryptedValue.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = decipher.update(encryptedBuffer);
  decipher.final();
  return decrypted;
}

// The magic number is used to identify the file format
const MAGIC = Buffer.from('PP01');
const HEADER_LENGTH = MAGIC.length + IV_LENGTH;

// | MAGIC (4 bytes) | IV (12 bytes) | ... encrypted data ... | TAG (16 bytes) |

export function createEncryptTransformer({ key, iv = randomBytes(IV_LENGTH) }: { key: BinaryLike; iv?: Buffer }) {
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const header = Buffer.concat([MAGIC, iv]);

  let headerWritten = false;

  const transform = new Transform({
    transform(chunk: Buffer, _encoding, callback: (error?: Error | null) => void) {
      if (!headerWritten) {
        this.push(header);
        headerWritten = true;
      }

      try {
        const encrypted = cipher.update(chunk);
        this.push(encrypted);
        callback();
      } catch (error) {
        callback(castError(error));
      }
    },
    flush(callback: (error?: Error | null) => void) {
      try {
        const final = cipher.final();
        if (final.length > 0) {
          this.push(final);
        }
        this.push(cipher.getAuthTag());
        callback();
      } catch (error) {
        callback(castError(error));
      }
    },
  });

  return transform;
}

export function createDecryptTransformer({ key }: { key: BinaryLike }) {
  let header = Buffer.alloc(0);
  let decipher: DecipherGCM;
  let last16Bytes: Buffer = Buffer.alloc(0);

  const transform = new Transform({
    transform(chunk: Buffer, _encoding, callback: (error?: Error | null) => void) {
      const chunkWithPreviousLast16Bytes = Buffer.concat([last16Bytes, chunk]);
      const isThereAtLeast16Bytes = chunkWithPreviousLast16Bytes.length >= TAG_LENGTH;

      let chunkWithoutLast16Bytes: Buffer = isThereAtLeast16Bytes ? chunkWithPreviousLast16Bytes.subarray(0, chunkWithPreviousLast16Bytes.length - TAG_LENGTH) : Buffer.alloc(0);
      last16Bytes = isThereAtLeast16Bytes ? chunkWithPreviousLast16Bytes.subarray(chunkWithPreviousLast16Bytes.length - TAG_LENGTH) : chunkWithPreviousLast16Bytes;

      if (header.length < HEADER_LENGTH) {
        const headerChunk = chunkWithoutLast16Bytes.subarray(0, HEADER_LENGTH - header.length);
        header = Buffer.concat([header, headerChunk]);
        chunkWithoutLast16Bytes = chunkWithoutLast16Bytes.subarray(headerChunk.length);
      }

      if (header.length === HEADER_LENGTH && isNil(decipher)) {
        const magic = header.subarray(0, MAGIC.length);

        if (!magic.equals(MAGIC)) {
          this.destroy(new Error('Invalid magic number'));
          return;
        }

        const iv = header.subarray(MAGIC.length, MAGIC.length + IV_LENGTH);

        decipher = createDecipheriv(ALGORITHM, key, iv);
      }

      if (decipher !== undefined && chunkWithoutLast16Bytes.length > 0) {
        try {
          const decrypted = decipher.update(chunkWithoutLast16Bytes);
          this.push(decrypted);
          callback();
        } catch (error) {
          callback(castError(error));
        }
      } else {
        callback();
      }
    },
    flush(callback: (error?: Error | null) => void) {
      try {
        decipher.setAuthTag(last16Bytes);
        this.push(decipher.final());
        callback();
      } catch (error) {
        callback(castError(error));
      }
    },
  });

  return transform;
}
