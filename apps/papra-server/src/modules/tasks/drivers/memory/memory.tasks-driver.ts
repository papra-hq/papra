import type { TaskServiceDriverDefinition } from '../../tasks.types';
import { createMemoryDriver } from '@cadence-mq/driver-memory';

export function createMemoryTaskServiceDriver(): TaskServiceDriverDefinition {
  const driver = createMemoryDriver();

  return {
    driver,
  };
}
