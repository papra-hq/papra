import { describe, expect, test } from 'vitest';
import { addSuffixToStorageKey } from './storage.models';

describe('storage models', () => {
  describe('addSuffixToStorageKey', () => {
    test('given a storage key and a suffix, add the suffix before the file extension', () => {
      expect(addSuffixToStorageKey({ storageKey: 'file.txt', suffix: '1' })).to.eql('file_1.txt');
      expect(addSuffixToStorageKey({ storageKey: 'archive.tar.gz', suffix: 'backup' })).to.eql(
        'archive.tar_backup.gz',
      );
    });

    test('if there is no file extension, add the suffix at the end of the storage key', () => {
      expect(addSuffixToStorageKey({ storageKey: 'file', suffix: '2' })).to.eql('file_2');
      expect(addSuffixToStorageKey({ storageKey: 'archive', suffix: 'backup' })).to.eql(
        'archive_backup',
      );
    });

    test('the suffix can be either a string or a number', () => {
      expect(addSuffixToStorageKey({ storageKey: 'file.txt', suffix: 2 })).to.eql('file_2.txt');
      expect(addSuffixToStorageKey({ storageKey: 'file.txt', suffix: '2' })).to.eql('file_2.txt');
    });

    test('filenames starting with a dot (e.g. .env) are supported', () => {
      expect(addSuffixToStorageKey({ storageKey: '.env', suffix: 'backup' })).to.eql('.env_backup');
      expect(addSuffixToStorageKey({ storageKey: '.env.local', suffix: 'backup' })).to.eql(
        '.env_backup.local',
      );
    });

    test('the storage key path can contain directories, the suffix should be added to the file name only', () => {
      expect(addSuffixToStorageKey({ storageKey: 'path/to/file.txt', suffix: '1' })).to.eql(
        'path/to/file_1.txt',
      );
      expect(
        addSuffixToStorageKey({ storageKey: 'path/dir.with.dots/file.txt', suffix: '2' }),
      ).to.eql('path/dir.with.dots/file_2.txt');
    });

    test('if the storage key ends with a dot, the suffix should be added before the dot', () => {
      expect(addSuffixToStorageKey({ storageKey: 'file.', suffix: '1' })).to.eql('file_1.');
      expect(addSuffixToStorageKey({ storageKey: 'archive.', suffix: 'backup' })).to.eql(
        'archive_backup.',
      );
    });
  });
});
