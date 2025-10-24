import type { ShutdownHandlerRegistration } from '../graceful-shutdown/graceful-shutdown.services';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export { setupDatabase };

function setupDatabase({
  url,
  authToken,
  encryptionKey,
  registerShutdownHandler,
}: {
  url: string;
  authToken?: string;
  encryptionKey?: string;
  registerShutdownHandler?: ShutdownHandlerRegistration;
}) {
  const client = createClient({ url, authToken, encryptionKey });

  const db = drizzle(client);

  registerShutdownHandler?.({
    id: 'database-client-close',
    handler: () => client.close(),
  });

  return {
    db,
    client,
  };
}
