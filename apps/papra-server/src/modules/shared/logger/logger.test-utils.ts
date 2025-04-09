import { createInMemoryLoggerTransport, createLogger } from '@crowlog/logger';

export function createTestLogger({ namespace = 'test' }: { namespace?: string } = {}) {
  const transport = createInMemoryLoggerTransport();
  const logger = createLogger({ namespace, transports: [transport] });

  return {
    logger,
    getLogs: transport.getLogs,
  };
}
