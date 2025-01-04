import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export { setupDatabase };

function setupDatabase({ url, authToken }: { url: string; authToken?: string }) {
  const client = createClient({ url, authToken });

  const db = drizzle(client);

  return {
    db,
    client,
  };
}
