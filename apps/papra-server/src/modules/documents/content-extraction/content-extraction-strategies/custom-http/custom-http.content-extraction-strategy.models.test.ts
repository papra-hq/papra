import { describe, expect, test } from 'vitest';
import {
  buildRequestBody,
  extractTextFromResponse,
} from './custom-http.content-extraction-strategy.models';

describe('custom-http.content-extraction-strategy.models', () => {
  describe('buildRequestBody', () => {
    test('the form-data format puts the file in the "file" field of a multipart body', async () => {
      const file = new File(['lorem ipsum'], 'file.txt', { type: 'text/plain' });

      const body = await buildRequestBody({ uploadFormat: 'form-data', file });

      expect(body).toBeInstanceOf(FormData);

      const uploadedFile = (body as FormData).get('file') as File;
      expect(uploadedFile.name).to.eql('file.txt');
      expect(uploadedFile.type).to.eql('text/plain');
      expect(await uploadedFile.text()).to.eql('lorem ipsum');
    });

    test('the json format embeds the base64-encoded file alongside its name and type', async () => {
      const file = new File(['lorem ipsum'], 'file.txt', { type: 'text/plain' });

      const body = await buildRequestBody({ uploadFormat: 'json', file });

      expect(body).to.eql({
        document: {
          filename: 'file.txt',
          type: 'text/plain',
          content: 'bG9yZW0gaXBzdW0=',
        },
      });
    });

    test('an unsupported upload format throws', async () => {
      const file = new File(['lorem ipsum'], 'file.txt', { type: 'text/plain' });

      await expect(buildRequestBody({ uploadFormat: 'xml' as never, file })).rejects.toThrow(
        'Unsupported upload format.',
      );
    });
  });

  describe('extractTextFromResponse', () => {
    describe('when the response format is text', () => {
      test('the whole string response is used as the extracted text', () => {
        expect(
          extractTextFromResponse({
            response: 'extracted text',
            responseFormat: 'text',
            jsonResponseTextPath: [],
          }),
        ).to.eql({ text: 'extracted text' });
      });

      test('a non-string response throws', () => {
        expect(() =>
          extractTextFromResponse({
            response: { text: 'extracted text' },
            responseFormat: 'text',
            jsonResponseTextPath: [],
          }),
        ).to.throw('Expected response to be a string, but got object');
      });
    });

    describe('when the response format is json', () => {
      test('the text is read from the top-level key when the path has a single segment', () => {
        expect(
          extractTextFromResponse({
            response: { text: 'extracted text' },
            responseFormat: 'json',
            jsonResponseTextPath: ['text'],
          }),
        ).to.eql({ text: 'extracted text' });
      });

      test('the text is read by walking a nested path', () => {
        expect(
          extractTextFromResponse({
            response: { data: { result: { content: 'extracted text' } } },
            responseFormat: 'json',
            jsonResponseTextPath: ['data', 'result', 'content'],
          }),
        ).to.eql({ text: 'extracted text' });
      });

      test('a non-object response throws', () => {
        expect(() =>
          extractTextFromResponse({
            response: 'extracted text',
            responseFormat: 'json',
            jsonResponseTextPath: ['text'],
          }),
        ).to.throw('Expected response to be an object, but got string');
      });

      test('a null response throws', () => {
        expect(() =>
          extractTextFromResponse({
            response: null,
            responseFormat: 'json',
            jsonResponseTextPath: ['text'],
          }),
        ).to.throw('Expected response to be an object, but got object');
      });

      test('a missing key along the path throws, naming the missing key', () => {
        expect(() =>
          extractTextFromResponse({
            response: { data: { result: {} } },
            responseFormat: 'json',
            jsonResponseTextPath: ['data', 'result', 'content'],
          }),
        ).to.throw('Expected response to have key content.');
      });

      test('a non-string value at the end of the path throws', () => {
        expect(() =>
          extractTextFromResponse({
            response: { text: { nested: 'extracted text' } },
            responseFormat: 'json',
            jsonResponseTextPath: ['text'],
          }),
        ).to.throw('Expected response to be a string, but got object');
      });
    });

    test('an unsupported response format throws', () => {
      expect(() =>
        extractTextFromResponse({
          response: 'extracted text',
          responseFormat: 'xml' as never,
          jsonResponseTextPath: [],
        }),
      ).to.throw('Unsupported response format');
    });
  });
});
