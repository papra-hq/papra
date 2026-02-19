import { describe, expect, test } from 'vitest';
import { addSuffixToFileName } from './document-storage.models';

describe('document-storage models', () => {
  describe('addSuffixToFileName', () => {
    test('given a storage key and a suffix, add the suffix before the file extension', () => {
      expect(addSuffixToFileName({ storageKey: 'file.txt', suffix: '1' })).to.eql('file_1.txt');
      expect(addSuffixToFileName({ storageKey: 'archive.tar.gz', suffix: 'backup' })).to.eql('archive.tar_backup.gz');
    });

    test('if there is no file extension, add the suffix at the end of the storage key', () => {
      expect(addSuffixToFileName({ storageKey: 'file', suffix: '2' })).to.eql('file_2');
      expect(addSuffixToFileName({ storageKey: 'archive', suffix: 'backup' })).to.eql('archive_backup');
    });

    test('the suffix can be either a string or a number', () => {
      expect(addSuffixToFileName({ storageKey: 'file.txt', suffix: 2 })).to.eql('file_2.txt');
      expect(addSuffixToFileName({ storageKey: 'file.txt', suffix: '2' })).to.eql('file_2.txt');
    });

    test('filenames starting with a dot (e.g. .env) are supported', () => {
      expect(addSuffixToFileName({ storageKey: '.env', suffix: 'backup' })).to.eql('.env_backup');
      expect(addSuffixToFileName({ storageKey: '.env.local', suffix: 'backup' })).to.eql('.env_backup.local');
    });

    test('the storage key path can contain directories, the suffix should be added to the file name only', () => {
      expect(addSuffixToFileName({ storageKey: 'path/to/file.txt', suffix: '1' })).to.eql('path/to/file_1.txt');
      expect(addSuffixToFileName({ storageKey: 'path/dir.with.dots/file.txt', suffix: '2' })).to.eql('path/dir.with.dots/file_2.txt');
    });

    test('if the storage key ends with a dot, the suffix should be added before the dot', () => {
      expect(addSuffixToFileName({ storageKey: 'file.', suffix: '1' })).to.eql('file_1.');
      expect(addSuffixToFileName({ storageKey: 'archive.', suffix: 'backup' })).to.eql('archive_backup.');
    });
  });
});
