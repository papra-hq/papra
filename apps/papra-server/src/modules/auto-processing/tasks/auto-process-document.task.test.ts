import { describe, expect, test } from 'vitest';
import type { AiServices } from '../../ai/ai.services';
import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { TaskServices } from '../../tasks/tasks.services';
import { overrideConfig } from '../../config/config.test-utils';
import { registerAutoProcessDocumentTask } from './auto-process-document.task';

function createTestTaskServices() {
  const registeredTaskNames: string[] = [];

  return {
    taskServices: {
      registerTask: ({ taskName }: { taskName: string }) => {
        registeredTaskNames.push(taskName);
      },
    } as unknown as TaskServices,
    registeredTaskNames,
  };
}

describe('auto-process-document task', () => {
  test('jobs queued under the former auto-tagging task name are still handled', async () => {
    const { taskServices, registeredTaskNames } = createTestTaskServices();

    await registerAutoProcessDocumentTask({
      taskServices,
      aiServices: {} as AiServices,
      db: {} as Database,
      eventServices: {} as EventServices,
      config: overrideConfig({ ai: { isEnabled: true } }),
    });

    expect(registeredTaskNames).to.eql(['auto-process-document', 'auto-tag-document']);
  });

  test('no task is registered when AI features are disabled', async () => {
    const { taskServices, registeredTaskNames } = createTestTaskServices();

    await registerAutoProcessDocumentTask({
      taskServices,
      aiServices: {} as AiServices,
      db: {} as Database,
      eventServices: {} as EventServices,
      config: overrideConfig({ ai: { isEnabled: false } }),
    });

    expect(registeredTaskNames).to.eql([]);
  });
});
