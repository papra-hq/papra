import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export { setupDatabase };

function setupDatabase({
  url,
  authToken,
  encryptionKey,
}: {
  url: string;
  authToken?: string;
  encryptionKey?: string;
}) {
  const client = createClient({ url, authToken, encryptionKey });

  const db = drizzle(client);

  return {
    db,
    client,
  };
}
