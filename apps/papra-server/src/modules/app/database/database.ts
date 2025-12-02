import type { ShutdownServices } from '../graceful-shutdown/graceful-shutdown.services';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export { setupDatabase };

function setupDatabase({
  url,
  authToken,
  encryptionKey,
  shutdownServices,
}: {
  url: string;
  authToken?: string;
  encryptionKey?: string;
  shutdownServices?: ShutdownServices;
}) {
  const client = createClient({ url, authToken, encryptionKey });

  const db = drizzle(client);

  shutdownServices?.registerShutdownHandler({
    id: 'database-client-close',
    handler: () => client.close(),
  });

  return {
    db,
    client,
  };
}
