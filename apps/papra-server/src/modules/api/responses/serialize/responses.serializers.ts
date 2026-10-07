export type ApiResponseBodySerializer = {
  contentType: string;
  serialize: (body: unknown) => ConstructorParameters<typeof Response>[0];
};

export const apiResponseBodySerializers = {
  'application/json': {
    contentType: 'application/json',
    serialize: (body): string => {
      const serialized = JSON.stringify(body);

      if (serialized === undefined) {
        throw new Error('Response body is not JSON serializable');
      }

      return serialized;
    },
  },
  'text/plain': {
    contentType: 'text/plain; charset=utf-8',
    serialize: (body): string => {
      if (typeof body !== 'string') {
        throw new Error('Plain text responses require a string body');
      }

      return body;
    },
  },
} satisfies Record<string, ApiResponseBodySerializer>;
