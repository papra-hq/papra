import type { Config } from '../../../config/config.types';
import type { StorageDriver, StorageServices } from '../drivers/drivers.models';
import { createDecryptTransformer, createEncryptTransformer } from '../../../shared/crypto/encryption';
import { isNil } from '../../../shared/utils';
import { ENCRYPTION_ALGORITHMS } from './document-encryption.constants';
import { createNewEncryptionKey, getKekByVersion, getMostRecentDocumentKek, unwrapEncryptionKey, wrapEncryptionKey } from './document-encryption.models';
import { createUnsupportedEncryptionAlgorithmError } from './document-encryptions.errors';

export function wrapWithEncryptionLayer({ storageDriver, encryptionConfig }: { storageDriver: StorageDriver; encryptionConfig: Config['documentsStorage']['encryption'] }): StorageServices {
  const { isEncryptionEnabled, documentKeyEncryptionKeys } = encryptionConfig;

  return {
    ...storageDriver,
    saveFile: async (driverArgs) => {
      const { fileStream, ...rest } = driverArgs;

      if (!isEncryptionEnabled) {
        return storageDriver.saveFile(driverArgs);
      }

      // Create a random 32 bytes encryption key
      const encryptionKey = createNewEncryptionKey();

      const encryptedFileStream = createEncryptTransformer({ key: encryptionKey });

      const driverResult = await storageDriver.saveFile({
        fileStream: fileStream.pipe(encryptedFileStream),
        ...rest,
      });

      // In order to store the encryption key, we encrypt it with the most recent KEK from the config
      const kek = getMostRecentDocumentKek({ documentKeyEncryptionKeys });

      return {
        ...driverResult,
        fileEncryptionKeyWrapped: wrapEncryptionKey({ encryptionKey, kek }),
        fileEncryptionAlgorithm: ENCRYPTION_ALGORITHMS.AES_256_GCM,
        fileEncryptionKekVersion: kek.version,
      };
    },
    getFileStream: async ({ fileEncryptionKeyWrapped, fileEncryptionKekVersion, fileEncryptionAlgorithm, ...driverArgs }) => {
      const { fileStream } = await storageDriver.getFileStream(driverArgs);

      if (isNil(fileEncryptionKeyWrapped) || isNil(fileEncryptionKekVersion) || isNil(fileEncryptionAlgorithm)) {
        // If the file is not encrypted, we return the file stream as is
        return { fileStream };
      }

      if (fileEncryptionAlgorithm !== ENCRYPTION_ALGORITHMS.AES_256_GCM) {
        throw createUnsupportedEncryptionAlgorithmError();
      }

      const kek = getKekByVersion({ documentKeyEncryptionKeys, version: fileEncryptionKekVersion });

      const encryptionKey = unwrapEncryptionKey({ wrappedEncryptionKey: fileEncryptionKeyWrapped, kek });

      return {
        fileStream: fileStream.pipe(createDecryptTransformer({ key: encryptionKey })),
      };
    },
  };
}
