export type ApiRequestBodyParser = {
  parse: (request: Request) => Promise<unknown>;
  errorMessage: string;
};

export const apiRequestBodyParsers = {
  'application/json': {
    parse: async (request: Request): Promise<unknown> => request.json(),
    errorMessage: 'Invalid JSON body',
  },
  'text/plain': {
    parse: async (request: Request) => request.text(),
    errorMessage: 'Invalid text body',
  },
} satisfies Record<string, ApiRequestBodyParser>;
