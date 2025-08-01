import { overrideConfig } from '../config/config.test-utils';
import { createTaskServices } from './tasks.services';

export function createInMemoryTaskServices({ workerId = 'test' }: { workerId?: string } = {}) {
  const config = overrideConfig({ tasks: { worker: { id: workerId } } });

  return createTaskServices({ config });
}
