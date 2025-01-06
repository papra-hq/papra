import { describe, expect, test } from 'vitest';
import { getFormData } from './http-client.models';

describe('http-client models', () => {
  describe('getFormData', () => {
    test('transforms a record into a FormData object', () => {
      const formData = getFormData({
        foo: 'bar',
        baz: 'qux',
        file1: new Blob(['file1']),
        file2: new File(['file2'], 'file2.txt'),
      });

      expect(formData.get('foo')).to.eql('bar');
      expect(formData.get('baz')).to.eql('qux');
      expect(formData.get('file1')).to.be.instanceOf(Blob);
      expect(formData.get('file2')).to.be.instanceOf(File);
    });
  });
});
