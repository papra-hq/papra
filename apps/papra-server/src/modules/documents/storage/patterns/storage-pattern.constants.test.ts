import { describe, expect, test } from 'vitest';
import { ORGANIZATION_ID_REGEX } from '../../../organizations/organizations.constants';
import { DOCUMENT_ID_REGEX } from '../../documents.constants';
import { DUMMY_DOCUMENT_ID, DUMMY_ORGANIZATION_ID } from './storage-pattern.constants';

describe('storage-pattern constants', () => {
  describe('dummy document id', () => {
    test('a valid, hard-coded document id for document storage pattern validation', () => {
      expect(DUMMY_DOCUMENT_ID).to.match(DOCUMENT_ID_REGEX);
    });
  });

  describe('dummy organization id', () => {
    test('a valid, hard-coded organization id for document storage pattern validation', () => {
      expect(DUMMY_ORGANIZATION_ID).to.match(ORGANIZATION_ID_REGEX);
    });
  });
});
