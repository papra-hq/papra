import type { Accessor, Setter } from 'solid-js';
import type { Pagination } from './pagination.types';
import { useSearchParams } from '@solidjs/router';
import { resolveSetterValue } from '../signals/setters';
import { asSingleParam } from '../utils/query-params';

export function createParamSynchronizedPagination({
  defaultPageIndex = 0,
  defaultPageSize = 15,
  pageIndexParamName = 'page',
  pageSizeParamName = 'pageSize',
}: {
  defaultPageIndex?: number;
  defaultPageSize?: number;
  pageIndexParamName?: string;
  pageSizeParamName?: string;
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const getPagination: Accessor<Pagination> = () => {
    const pageIndex = Number(asSingleParam(searchParams[pageIndexParamName]) ?? defaultPageIndex);
    const pageSize = Number(asSingleParam(searchParams[pageSizeParamName]) ?? defaultPageSize);

    return { pageIndex, pageSize };
  };

  const setPagination: Setter<Pagination> = (valueOrUpdater) => {
    const value = resolveSetterValue(valueOrUpdater, getPagination());

    setSearchParams(
      {
        [pageIndexParamName]: value.pageIndex === defaultPageIndex ? undefined : value.pageIndex,
        [pageSizeParamName]: value.pageSize === defaultPageSize ? undefined : value.pageSize,
      },
      { replace: true },
    );
  };

  return [getPagination, setPagination] as const;
}
