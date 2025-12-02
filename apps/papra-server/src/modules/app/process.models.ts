export function getProcessMode({ config }: { config: { processMode: 'web' | 'worker' | 'all' } }) {
  const { processMode } = config;

  return {
    isWebMode: processMode === 'all' || processMode === 'web',
    isWorkerMode: processMode === 'all' || processMode === 'worker',
    processMode,
  };
}
