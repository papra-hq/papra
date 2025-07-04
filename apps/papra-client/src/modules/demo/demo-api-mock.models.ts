/* eslint-disable ts/no-empty-object-type */
import type { HttpClientOptions, ResponseType } from '../shared/http/http-client';
import { joinUrlPaths } from '@corentinth/chisels';

type ExtractRouteParams<Path extends string>
  = Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [k in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : Path extends `${infer _Start}:${infer Param}`
      ? { [k in Param]: string }
      : {};

export function defineHandler<Path extends string>({
  path,
  method,
  handler,
}: {
  path: Path;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: <R extends ResponseType = 'json'>(params: { params: ExtractRouteParams<Path> } & HttpClientOptions<R>) => any;
}) {
  return {
    [`/${joinUrlPaths(method, path)}`]: { handler },
  };
}
