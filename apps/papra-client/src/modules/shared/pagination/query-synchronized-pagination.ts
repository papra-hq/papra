import { createEffect, type Accessor, type Setter } from 'solid-js';
import type { Pagination } from './pagination.types';
import { useSearchParams } from '@solidjs/router';
import { resolveSetterValue } from '../signals/setters';
import { asSingleParam } from '../utils/query-params';

export function createParamSynchronizedPagination({
  defaultPageIndex = 0,
  defaultPageSize = 15,
  pageIndexParamName = 'page',
  pageSizeParamName = 'pageSize',
  localStorageKey,
}: {
  defaultPageIndex?: number;
  defaultPageSize?: number;
  pageIndexParamName?: string;
  pageSizeParamName?: string;
  localStorageKey?: string;
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const getPagination: Accessor<Pagination> = () => {
    const urlPageIndex = Number(asSingleParam(searchParams[pageIndexParamName]));
    const pageIndex =
      Number.isInteger(urlPageIndex) && urlPageIndex >= 0 ? urlPageIndex : defaultPageIndex;

    let initialPageSize = defaultPageSize;
    if (localStorageKey) {
      const stored = localStorage.getItem(localStorageKey);
      if (stored !== null) {
        const parsed = Number(stored);
        if (Number.isInteger(parsed) && parsed > 0) {
          initialPageSize = parsed;
        }
      }
    }

    const urlPageSize = Number(asSingleParam(searchParams[pageSizeParamName]));
    const pageSize =
      Number.isInteger(urlPageSize) && urlPageSize > 0 ? urlPageSize : initialPageSize;

    return { pageIndex, pageSize };
  };

  const setPagination: Setter<Pagination> = (valueOrUpdater) => {
    const value = resolveSetterValue(valueOrUpdater, getPagination());

    if (localStorageKey) {
      localStorage.setItem(localStorageKey, String(value.pageSize));
    }

    setSearchParams(
      {
        [pageIndexParamName]: value.pageIndex === defaultPageIndex ? undefined : value.pageIndex,
        [pageSizeParamName]: value.pageSize === defaultPageSize ? undefined : value.pageSize,
      },
      { replace: true },
    );
  };

  createEffect(() => {
    const pageIndex = searchParams[pageIndexParamName];
    const pageSize = searchParams[pageSizeParamName];

    const currentPagination = getPagination();
    const nextParams: Record<string, string | undefined> = {};
    let needsUpdate = false;

    if (pageIndex === undefined && currentPagination.pageIndex !== defaultPageIndex) {
      nextParams[pageIndexParamName] = String(currentPagination.pageIndex);
      needsUpdate = true;
    }

    if (pageSize === undefined && currentPagination.pageSize !== defaultPageSize) {
      nextParams[pageSizeParamName] = String(currentPagination.pageSize);
      needsUpdate = true;
    }

    if (needsUpdate) {
      setSearchParams(nextParams, { replace: true });
    }
  });

  return [getPagination, setPagination] as const;
}

