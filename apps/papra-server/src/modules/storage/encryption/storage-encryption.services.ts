import type { StorageDriver, StorageService } from '../drivers/drivers.models';
import type { StorageEncryptionOptions } from '../storage.types';
import { createDecryptTransformer, createEncryptTransformer } from '../../shared/crypto/encryption';
import { isNil } from '../../shared/utils';
import { ENCRYPTION_ALGORITHMS } from './storage-encryption.constants';
import {
  createNewEncryptionKey,
  getKekByVersion,
  getMostRecentKek,
  unwrapEncryptionKey,
  wrapEncryptionKey,
} from './storage-encryption.models';
import { createUnsupportedEncryptionAlgorithmError } from './storage-encryption.errors';

export function wrapWithEncryptionLayer({
  storageDriver,
  encryptionOptions,
}: {
  storageDriver: StorageDriver;
  encryptionOptions: StorageEncryptionOptions;
}): StorageService {
  const { isEncryptionEnabled, keyEncryptionKeys } = encryptionOptions;

  return {
    ...storageDriver,
    saveFile: async (driverArgs) => {
      const { fileStream, ...rest } = driverArgs;

      if (!isEncryptionEnabled) {
        await storageDriver.saveFile(driverArgs);
        return {};
      }

      const encryptionKey = createNewEncryptionKey();
      const encryptedFileStream = createEncryptTransformer({ key: encryptionKey });

      await storageDriver.saveFile({
        fileStream: fileStream.pipe(encryptedFileStream),
        ...rest,
      });

      const kek = getMostRecentKek({ keyEncryptionKeys });

      return {
        fileEncryptionKeyWrapped: wrapEncryptionKey({ encryptionKey, kek }),
        fileEncryptionAlgorithm: ENCRYPTION_ALGORITHMS.AES_256_GCM,
        fileEncryptionKekVersion: kek.version,
      };
    },
    getFileStream: async ({
      fileEncryptionKeyWrapped,
      fileEncryptionKekVersion,
      fileEncryptionAlgorithm,
      ...driverArgs
    }) => {
      const { fileStream } = await storageDriver.getFileStream(driverArgs);

      if (
        isNil(fileEncryptionKeyWrapped) ||
        isNil(fileEncryptionKekVersion) ||
        isNil(fileEncryptionAlgorithm)
      ) {
        return { fileStream };
      }

      if (fileEncryptionAlgorithm !== ENCRYPTION_ALGORITHMS.AES_256_GCM) {
        throw createUnsupportedEncryptionAlgorithmError();
      }

      const kek = getKekByVersion({ keyEncryptionKeys, version: fileEncryptionKekVersion });
      const encryptionKey = unwrapEncryptionKey({
        wrappedEncryptionKey: fileEncryptionKeyWrapped,
        kek,
      });

      return {
        fileStream: fileStream.pipe(createDecryptTransformer({ key: encryptionKey })),
      };
    },
  };
}
