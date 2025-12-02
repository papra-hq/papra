import { describe, expect, test } from 'vitest';
import { getProcessMode } from './process.models';

describe('process models', () => {
  describe('getProcessMode', () => {
    test('when the process mode is set to all, the api server and worker should be enabled', () => {
      expect(
        getProcessMode({ config: { processMode: 'all' } }),
      ).to.eql({
        isWebMode: true,
        isWorkerMode: true,
        processMode: 'all',
      });
    });

    test('when the process mode is set to web, only the api server should be enabled', () => {
      expect(
        getProcessMode({ config: { processMode: 'web' } }),
      ).to.eql({
        isWebMode: true,
        isWorkerMode: false,
        processMode: 'web',
      });
    });

    test('when the process mode is set to worker, only the worker should be enabled', () => {
      expect(
        getProcessMode({ config: { processMode: 'worker' } }),
      ).to.eql({
        isWebMode: false,
        isWorkerMode: true,
        processMode: 'worker',
      });
    });
  });
});
