import { md5 } from '../../../../shared/crypto/hash';

export function createSseConfig({
  encryptionKey,
  algorithm,
}: { encryptionKey: string; algorithm: string }) {
  const keyMd5 = md5(encryptionKey, { digest: 'base64' });

  return {
    SSECustomerAlgorithm: algorithm,
    SSECustomerKey: encryptionKey,
    SSECustomerKeyMD5: keyMd5,
  };
}
