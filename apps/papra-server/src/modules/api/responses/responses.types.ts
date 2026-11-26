import type { apiResponseBodySerializers } from './serialize/responses.serializers';

export type ApiResponseContentType = keyof typeof apiResponseBodySerializers;

export type ApiResponseBodylessStatus = 204 | 205 | 304;

export type ApiResponse = {
  status: number;
  contentType?: string;
  body?: unknown;
  headers?: Record<string, string>;
};
