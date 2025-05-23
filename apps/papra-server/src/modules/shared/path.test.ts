import { describe, expect, test } from 'vitest';
import { fileUrlToPath } from './path';

describe('path', () => {
  describe('fileUrlToPath', () => {
    test('transform a path using file protocol to a path, with support for relative paths', () => {
      expect(fileUrlToPath({ fileUrl: 'file:./test.txt' })).to.equal('./test.txt');
      expect(fileUrlToPath({ fileUrl: 'file:/test.txt' })).to.equal('/test.txt');
      expect(fileUrlToPath({ fileUrl: 'file:test.txt' })).to.equal('test.txt');
      expect(fileUrlToPath({ fileUrl: 'file:../test.txt' })).to.equal('../test.txt');
      expect(fileUrlToPath({ fileUrl: 'file://../test.txt' })).to.equal('../test.txt');
      expect(fileUrlToPath({ fileUrl: 'file:./foo/bar/test.txt' })).to.equal('./foo/bar/test.txt');
      expect(fileUrlToPath({ fileUrl: 'file:///foo/bar/test.txt' })).to.equal('/foo/bar/test.txt');
      expect(fileUrlToPath({ fileUrl: 'file://foo/bar/test.txt' })).to.equal('foo/bar/test.txt');
    });

    test('transform url encoded characters', () => {
      expect(fileUrlToPath({ fileUrl: 'file:./foo%20bar/test.txt' })).to.equal('./foo bar/test.txt');
    });
  });
});
