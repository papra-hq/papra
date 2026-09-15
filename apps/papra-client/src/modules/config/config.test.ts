import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const getItem = vi.fn<Storage['getItem']>();

beforeEach(() => {
  vi.resetModules();
  getItem.mockReset();
  vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
  vi.stubGlobal('localStorage', { getItem });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('demo mode', () => {
  test.each([
    { dev: true, env: 'false', override: 'true', expected: true },
    { dev: true, env: 'false', override: 'false', expected: false },
    { dev: true, env: 'false', override: null, expected: false },
    { dev: true, env: 'false', override: 'invalid', expected: false },
    { dev: true, env: 'true', override: 'false', expected: true },
    { dev: false, env: 'false', override: 'true', expected: false },
    { dev: false, env: 'true', override: 'false', expected: true },
  ])(
    'DEV=$dev env=$env override=$override resolves to $expected',
    async ({ dev, env, override, expected }) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('VITE_IS_DEMO_MODE', env);
      getItem.mockReturnValue(override);

      const { isDemoMode } = await import('./config');
      expect(isDemoMode).toBe(expected);

      if (dev) {
        expect(getItem).toHaveBeenCalledWith('papra:dev:demo-mode');
      } else {
        expect(getItem).not.toHaveBeenCalled();
      }
    },
  );

  test.each(['true', 'false'])('falls back to env=%s when storage is blocked', async (env) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_IS_DEMO_MODE', env);
    getItem.mockImplementation(() => {
      throw new Error('Storage blocked');
    });

    const { isDemoMode } = await import('./config');
    expect(isDemoMode).toBe(env === 'true');
  });
});
