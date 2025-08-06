import crypto from 'node:crypto';

export async function deriveKeyWithHkdf({ key, salt, info, outputLength = 64 }: { key: string; salt: string; info: string; outputLength?: number }): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    crypto.hkdf('sha512', key, salt, info, outputLength, (err, derivedKeyBuffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKeyBuffer);
      }
    });
  });
}
