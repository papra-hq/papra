import { describe, expect, test, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createParamSynchronizedPagination } from './query-synchronized-pagination';

const searchParamsStore = { page: undefined as string | undefined, pageSize: undefined as string | undefined };
const setSearchParamsMock = vi.fn((params) => {
  Object.assign(searchParamsStore, params);
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [searchParamsStore, setSearchParamsMock],
}));

describe('createParamSynchronizedPagination', () => {
  beforeEach(() => {
    searchParamsStore.page = undefined;
    searchParamsStore.pageSize = undefined;
    localStorage.clear();
    setSearchParamsMock.mockClear();
  });

  test('should return default values when URL and localStorage are empty', () => {
    createRoot((dispose) => {
      const [getPagination] = createParamSynchronizedPagination();
      expect(getPagination()).toEqual({ pageIndex: 0, pageSize: 15 });
      dispose();
    });
  });

  test('should prioritize URL parameters over localStorage', () => {
    localStorage.setItem('papra:documents:pageSize', '50');
    searchParamsStore.pageSize = '100';

    createRoot((dispose) => {
      const [getPagination] = createParamSynchronizedPagination({
        localStorageKey: 'papra:documents:pageSize',
      });
      expect(getPagination()).toEqual({ pageIndex: 0, pageSize: 100 });
      dispose();
    });
  });

  test('should fallback to localStorage when URL parameter is missing', () => {
    localStorage.setItem('papra:documents:pageSize', '50');

    createRoot((dispose) => {
      const [getPagination] = createParamSynchronizedPagination({
        localStorageKey: 'papra:documents:pageSize',
      });
      expect(getPagination()).toEqual({ pageIndex: 0, pageSize: 50 });
      dispose();
    });
  });

  test('should write to localStorage and URL when setPagination is called', () => {
    createRoot((dispose) => {
      const [_, setPagination] = createParamSynchronizedPagination({
        localStorageKey: 'papra:documents:pageSize',
      });

      setPagination({ pageIndex: 1, pageSize: 50 });

      expect(localStorage.getItem('papra:documents:pageSize')).toBe('50');
      expect(setSearchParamsMock).toHaveBeenCalledWith(
        {
          page: 1,
          pageSize: 50,
        },
        { replace: true }
      );
      dispose();
    });
  });
});
