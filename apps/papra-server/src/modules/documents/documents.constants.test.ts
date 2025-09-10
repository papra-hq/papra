import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { MULTIPART_FORM_DATA_SINGLE_FILE_CONTENT_LENGTH_OVERHEAD } from './documents.constants';

const unusuallyLongFileName = 'an-unusually-long-file-name-in-order-to-test-the-content-length-header-with-the-metadata-that-are-included-in-the-form-data-so-lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-sed-do-eiusmod-tempor-incididunt-ut-labore-et-dolore-magna-aliqua-ut-enim-ad-minim-veniam-quis-nostrud-exercitation-ullamco-laboris-nisi-ut-aliquip-ex-ea-commodo-consequat-duis-aute-irure-dolor-in-reprehenderit-in-voluptate-velit-esse-cillum-dolore-eu-fugiat-nulla-pariatur-excepteur-sint-occaecat-proident-in-voluptate-velit-esse-cillum-dolore-eu-fugiat-nulla-pariatur-excepteur-sint-occaecat-proident-in-voluptate-velit-esse-cillum-dolore-eu-fugiat-nulla-pariatur-excepteur-sint-occaecat-proident.txt';

describe('documents constants', () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe('MULTIPART_FORM_DATA_SINGLE_FILE_CONTENT_LENGTH_OVERHEAD', () => {
    test('when uploading a formdata multipart, the body has boundaries and other metadata, so the content length is greater than the file size', async () => {
      const fileSize = 100;
      const formData = new FormData();
      formData.append('file', new File(['a'.repeat(fileSize)], unusuallyLongFileName, { type: 'text/plain' }));
      const body = new Response(formData);
      const contentLength = Buffer.from(await body.arrayBuffer()).length;

      expect(contentLength).to.be.greaterThan(fileSize);
      expect(contentLength).to.be.lessThan(fileSize + MULTIPART_FORM_DATA_SINGLE_FILE_CONTENT_LENGTH_OVERHEAD);
    });
  });
});
