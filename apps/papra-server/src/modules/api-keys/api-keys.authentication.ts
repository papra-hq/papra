import { extractApiKeyToken } from './api-keys.models';

export function buildGetApiKeyFromHeaders<Key>({
  lookupApiKeyByToken,
}: {
  lookupApiKeyByToken: (args: { token: string }) => Promise<Key | null>;
}) {
  return async ({ headers }: { headers: Headers }): Promise<Key | null> => {
    const token = extractApiKeyToken({ headers });

    if (token === undefined) {
      return null;
    }

    return lookupApiKeyByToken({ token });
  };
}
