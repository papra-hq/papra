import { describe, expect, test } from 'vitest';
import { isContentLengthPessimisticallyTooLarge } from './file-upload';

describe('file-upload', () => {
  describe('isContentLengthPessimisticallyTooLarge', () => {
    test(`a file upload request is considered pessimistically too large when 
        - a content length header is present
        - a max file size limit is provided
        - the content length is greater than the max file size limit plus an over-estimated overhead due to the multipart form data (boundaries, metadata, etc)`, () => {
      expect(
        isContentLengthPessimisticallyTooLarge({
          contentLength: 1_000,
          maxFileSize: 1_000,
          overhead: 512,
        }),
      ).to.eql(false);

      expect(
        isContentLengthPessimisticallyTooLarge({
          contentLength: undefined,
          maxFileSize: 1_000,
          overhead: 512,
        }),
      ).to.eql(false);

      expect(
        isContentLengthPessimisticallyTooLarge({
          contentLength: 1_000,
          maxFileSize: undefined,
          overhead: 512,
        }),
      ).to.eql(false);

      expect(
        isContentLengthPessimisticallyTooLarge({
          contentLength: undefined,
          maxFileSize: undefined,
          overhead: 512,
        }),
      ).to.eql(false);

      expect(
        isContentLengthPessimisticallyTooLarge({
          contentLength: 1_513,
          maxFileSize: 1_000,
          overhead: 512,
        }),
      ).to.eql(true);
    });
  });
});
