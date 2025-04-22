import { describe, expect, test } from 'vitest';
import { coerceDates, getFormData } from './http-client.models';

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

  describe('coerceDates', () => {
    test('transforms common date strings (createdAt, updatedAt, deletedAt) into Date objects, keeping the rest of the object intact', () => {
      const obj = {
        createdAt: '2021-01-01T00:00:00.000Z',
        updatedAt: '2021-01-02T00:00:00.000Z',
        deletedAt: '2021-01-03T00:00:00.000Z',
        expiresAt: '2021-01-04T00:00:00.000Z',
        lastUsedAt: '2021-01-05T00:00:00.000Z',
        foo: 'bar',
        baz: 'qux',
      };

      const coercedObj = coerceDates(obj);

      expect(coercedObj).to.eql({
        createdAt: new Date('2021-01-01T00:00:00.000Z'),
        updatedAt: new Date('2021-01-02T00:00:00.000Z'),
        deletedAt: new Date('2021-01-03T00:00:00.000Z'),
        expiresAt: new Date('2021-01-04T00:00:00.000Z'),
        lastUsedAt: new Date('2021-01-05T00:00:00.000Z'),
        foo: 'bar',
        baz: 'qux',
      });
    });

    test('nullish values are transformed into undefined', () => {
      const obj = {
        createdAt: null,
        updatedAt: undefined,
        deletedAt: '2021-01-03T00:00:00.000Z',
        foo: 'bar',
        baz: 'qux',
      };

      const coercedObj = coerceDates(obj);

      expect(coercedObj).to.eql({
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: new Date('2021-01-03T00:00:00.000Z'),
        foo: 'bar',
        baz: 'qux',
      });
    });

    test('non present date keys are not transformed', () => {
      const obj = {
        createdAt: '2021-01-03T00:00:00.000Z',
        foo: 'bar',
        baz: 'qux',
      };

      const coercedObj = coerceDates(obj);

      expect(coercedObj).to.eql({
        createdAt: new Date('2021-01-03T00:00:00.000Z'),
        foo: 'bar',
        baz: 'qux',
      });
    });
  });
});
